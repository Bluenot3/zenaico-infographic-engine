import { zipSync, strToU8 } from 'fflate';
import { readdir, readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'plugins/zenaico/plugin.json'), 'utf8'));
const files = {};
async function collect(folder, prefix) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' ||
        (entry.name.startsWith('.env') && entry.name !== '.env.example')) continue;
    const file = resolve(folder, entry.name);
    if (entry.isDirectory()) await collect(file, `${prefix}/${entry.name}`);
    else if (entry.isFile()) files[`${prefix}/${entry.name}`] = new Uint8Array(await readFile(file));
  }
}
await collect(resolve(root, 'plugins/zenaico'), 'zenaico-plugin/plugins/zenaico');
files['zenaico-plugin/.agents/plugins/marketplace.json'] = new Uint8Array(await readFile(resolve(root, '.agents/plugins/marketplace.json')));
const installationGuide = await readFile(resolve(root, 'plugins/zenaico/README.md'), 'utf8');
files['zenaico-plugin/README.md'] = strToU8(installationGuide.replace('src="assets/', 'src="plugins/zenaico/assets/'));
files['zenaico-plugin/VERSION'] = strToU8(`${manifest.version}\n`);
await mkdir(resolve(root, 'release'), { recursive: true });
const path = resolve(root, `release/zenaico-plugin-${manifest.version}.zip`);
const archive = zipSync(files, { level: 6 });
await writeFile(path, archive);
await writeFile(`${path}.sha256`, `${createHash('sha256').update(archive).digest('hex')}  zenaico-plugin-${manifest.version}.zip\n`);
// The public Git marketplace contains the same standalone files as the ZIP.
// Users can install this branch without cloning the app or installing dependencies.
const marketplace = resolve(root, 'release/marketplace');
await rm(marketplace, { recursive: true, force: true });
for (const [name, bytes] of Object.entries(files)) {
  const target = resolve(marketplace, name.slice('zenaico-plugin/'.length));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
}
console.log(`Installable package: ${path}`);
