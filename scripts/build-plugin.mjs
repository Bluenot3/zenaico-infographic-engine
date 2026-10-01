import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, 'plugins/zenaico');
await mkdir(resolve(destination, 'assets'), { recursive: true });
await writeFile(resolve(destination, 'assets/zen-logo.svg'), (await readFile(resolve(root, 'public/zen-logo.svg'), 'utf8')).replace(/[ \t]+$/gm, ''));
await cp(resolve(root, 'public/zen-brand-logo.png'), resolve(destination, 'assets/zen-brand-logo.png'));
await cp(resolve(root, '.env.example'), resolve(destination, '.env.example'));
const result = await build({
  entryPoints: [resolve(root, 'plugin/src/server.ts')], outfile: resolve(destination, 'server.mjs'),
  bundle: true, platform: 'node', target: 'node22', format: 'esm', legalComments: 'eof', metafile: true,
  banner: { js: 'import { createRequire as zenaicoCreateRequire } from "node:module"; const require = zenaicoCreateRequire(import.meta.url);' },
});
// Retain dependency notices alongside the standalone bundle.
const packages = new Set(Object.keys(result.metafile.inputs).map(path => path.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1]).filter(Boolean));
const notices = [];
for (const name of [...packages].sort()) {
  const folder = resolve(root, 'node_modules', name);
  const metadata = JSON.parse(await readFile(resolve(folder, 'package.json'), 'utf8'));
  let licenseText = '';
  for (const file of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-MIT', 'license', 'license.md']) {
    try { licenseText = await readFile(resolve(folder, file), 'utf8'); break; } catch {}
  }
  notices.push(`${name}@${metadata.version}\nLicense: ${metadata.license || 'See package repository'}\n${licenseText}`);
}
await writeFile(resolve(destination, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n\n--------------------\n\n'));
console.log('Built standalone Codex plugin: plugins/zenaico/server.mjs');
