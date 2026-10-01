import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const native = JSON.parse(await readFile(resolve(root, 'plugins/zenaico/plugin.json'), 'utf8'));
const archiveName = `zenaico-skills-${native.version}.zip`;
const archive = await readFile(resolve(root, 'release', archiveName));
assert.ok(archive.length <= 100 * 1024 * 1024);
const expectedHash = (await readFile(resolve(root, 'release', `${archiveName}.sha256`), 'utf8')).split(' ')[0];
assert.equal(createHash('sha256').update(archive).digest('hex'), expectedHash);
const files = unzipSync(archive);
const names = Object.keys(files);
assert.equal(new Set(names.map(name => name.normalize('NFKC').toLowerCase())).size, names.length);
for (const name of names) {
  assert.ok(!name.startsWith('/') && !name.includes('\\') && !name.split('/').includes('..'));
  assert.ok(files[name].length <= 100 * 1024 * 1024);
  assert.ok(!/(?:^|\/)(?:mcp\.json|\.mcp\.json|\.app\.json|\.env)$/.test(name));
}
assert.ok(Object.values(files).reduce((total, bytes) => total + bytes.length, 0) <= 512 * 1024 * 1024);
const parse = name => JSON.parse(Buffer.from(files[`zenaico-skills/${name}`]).toString('utf8'));
const portable = parse('plugin.json');
const compatibility = parse('.codex-plugin/plugin.json');
for (const manifest of [portable, compatibility]) {
  assert.equal(manifest.name, native.name); assert.equal(manifest.version, native.version);
  assert.equal(manifest.mcpServers, undefined); assert.equal(manifest.apps, undefined);
  const settings = manifest.extensions?.['com.openai']?.interface || manifest.interface;
  assert.ok(settings.shortDescription.length <= 30);
  assert.ok(settings.longDescription.length <= 4000);
  assert.ok(settings.defaultPrompt.length <= 3);
  assert.equal(new Set(settings.defaultPrompt).size, settings.defaultPrompt.length);
  assert.ok(settings.defaultPrompt.every(prompt => prompt.length <= 128 && !prompt.includes('@')));
  for (const key of ['logo', 'composerIcon']) assert.ok(files[`zenaico-skills/${settings[key].replace(/^\.\//, '')}`]);
}
assert.deepEqual(Buffer.from(files['zenaico-skills/assets/zen-brand-logo.jpg']), await readFile(resolve(root, 'public/zen-brand-logo.jpg')));
const temp = await mkdtemp(join(tmpdir(), 'zenaico-submission-'));
try {
  for (const skill of ['create-infographics', 'sports-graphics']) {
    const prefix = `zenaico-skills/skills/${skill}`;
    const markdown = Buffer.from(files[`${prefix}/SKILL.md`]).toString('utf8');
    assert.ok(markdown.startsWith(`---\nname: ${skill}\n`));
    assert.ok(markdown.includes('scripts/zenaico.mjs'));
    const executable = join(temp, `${skill}.mjs`);
    await writeFile(executable, files[`${prefix}/scripts/zenaico.mjs`]);
    const status = JSON.parse(execFileSync(process.execPath, [executable, 'get_status'], {
      cwd: temp, timeout: 10000,
      env: { PATH: process.env.PATH, GEMINI_API_KEY: '', GOOGLE_API_KEY: '', OPENAI_API_KEY: '', ZENAICO_ENV_FILE: '', ZENAICO_OUTPUT_DIR: join(temp, 'library') },
      encoding: 'utf8',
    }));
    assert.equal(status.version, native.version);
    assert.deepEqual(status.providers, { google: false, openai: false });
    assert.equal(status.styleCount, 51);
  }
} finally { await rm(temp, { recursive: true, force: true }); }
console.log(`Validated ${archiveName}: upload structure, listing limits, logo, checksums and both self-contained skill runtimes.`);
