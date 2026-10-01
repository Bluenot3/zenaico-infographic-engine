import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'plugins/zenaico/plugin.json'), 'utf8'));
const repository = process.env.GITHUB_REPOSITORY;
const commit = process.env.GITHUB_SHA;
const token = process.env.GH_TOKEN;
const tag = `zenaico-v${manifest.version}`;
const branch = 'plugin-dist';
const staged = resolve(root, 'release/marketplace');
const files = [];
async function collect(folder, prefix = '') {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await collect(resolve(folder, entry.name), path);
    else if (entry.isFile()) files.push({ path, data: await readFile(resolve(folder, entry.name)) });
  }
}
await collect(staged);
if (!files.some(f => f.path === 'plugins/zenaico/server.mjs') ||
    !files.some(f => f.path === '.agents/plugins/marketplace.json')) {
  throw new Error('Build the complete standalone marketplace before publication.');
}
if (files.some(f => /(?:^|\/)\.env(?:$|\.(?!example$))/.test(f.path))) {
  throw new Error('Private environment files must not be published.');
}
if (process.argv.includes('--dry-run')) {
  console.log(`Ready to publish ${tag}: ${files.length} standalone marketplace files and a release ZIP.`);
  process.exit(0);
}
if (!repository || !commit || !token || process.env.GITHUB_REF !== 'refs/heads/main') {
  throw new Error('Publication requires the main-branch GitHub Actions environment.');
}
const headers = {
  authorization: `Bearer ${token}`, accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28', 'user-agent': 'zenaico-release',
};
async function request(path, method = 'GET', body, allowed = []) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    method, headers: { ...headers, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (allowed.includes(response.status)) return null;
  if (!response.ok) throw new Error(`GitHub ${method} ${path.split('?')[0]} failed (${response.status}).`);
  return response.status === 204 ? null : response.json();
}
const existing = await request(`releases/tags/${tag}`, 'GET', undefined, [404]);
if (existing && !existing.draft) {
  console.log(`${tag} is already public. Bump the plugin version to publish an update.`);
  process.exit(0);
}
if (existing && existing.target_commitish !== commit) {
  throw new Error('An unfinished release exists for another commit. Resolve it before republishing.');
}
const previous = await request(`git/ref/heads/${branch}`, 'GET', undefined, [404]);
// Create a complete distribution snapshot and retain the previous distribution
// commit as its parent. No force pushes and no generated bundle in app source.
const tree = [];
for (const file of files) {
  const blob = await request('git/blobs', 'POST', { content: file.data.toString('base64'), encoding: 'base64' });
  tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
}
const snapshot = await request('git/trees', 'POST', { tree });
const published = await request('git/commits', 'POST', {
  message: `Publish Zenaico Visual Studio ${manifest.version}`, tree: snapshot.sha,
  parents: [previous?.object.sha || commit],
});
if (previous) await request(`git/refs/heads/${branch}`, 'PATCH', { sha: published.sha, force: false });
else await request('git/refs', 'POST', { ref: `refs/heads/${branch}`, sha: published.sha });
const body = `The ZEN AI Co. visual engine as a standalone Codex plugin, with the official logo, advanced styles, image generation and editing, visual review, sports graphics and saved collections.

Download and extract the ZIP, or install the public Git marketplace:

\`\`\`bash
codex plugin marketplace add ${repository} --ref ${branch}
codex plugin add zenaico@zenaico
\`\`\`

Requires Node.js 22.12+ and your Gemini or OpenAI API key. Provider usage is billed by your provider. No npm dependencies need to be installed for the packaged plugin. See the included README for secure configuration.

This release is public through GitHub and the Git marketplace. A listing in the universal ChatGPT/Codex Plugins Directory requires a separately hosted HTTPS service, verified publisher and OpenAI approval. This release does not claim that approval.

Checks: app build, plugin protocol/provider/artifact tests, and standalone transport verification. Live paid-provider image rendering still requires credentials.

SHA-256 checksums are included for the ZIP. Source commit: ${commit}.`;
const release = existing || await request('releases', 'POST', {
  tag_name: tag, target_commitish: commit, name: `Zenaico Visual Studio ${manifest.version}`,
  body, draft: true, prerelease: false,
});
for (const name of [`zenaico-plugin-${manifest.version}.zip`, `zenaico-plugin-${manifest.version}.zip.sha256`]) {
  if (release.assets.some(asset => asset.name === name)) continue;
  const data = await readFile(resolve(root, 'release', name));
  const response = await fetch(`${release.upload_url.replace(/\{.*$/, '')}?name=${encodeURIComponent(name)}`, {
    method: 'POST', headers: { ...headers, 'content-type': name.endsWith('.zip') ? 'application/zip' : 'text/plain' }, body: data,
  });
  if (!response.ok) throw new Error(`Release asset upload failed (${response.status}): ${name}`);
}
await request(`releases/${release.id}`, 'PATCH', { draft: false, body, make_latest: 'true' });
console.log(`Public release: https://github.com/${repository}/releases/tag/${tag}`);
console.log(`Public marketplace: ${repository}@${branch}`);
