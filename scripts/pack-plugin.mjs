import { zipSync, strToU8 } from 'fflate';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'plugins/zenaico/plugin.json'), 'utf8'));
const files = {};
async function collect(folder, prefix) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.name === '.env' || entry.name === 'node_modules') continue;
    const file = resolve(folder, entry.name);
    if (entry.isDirectory()) await collect(file, `${prefix}/${entry.name}`);
    else if (entry.isFile()) files[`${prefix}/${entry.name}`] = new Uint8Array(await readFile(file));
  }
}
await collect(resolve(root, 'plugins/zenaico'), 'zenaico-plugin/plugins/zenaico');
files['zenaico-plugin/.agents/plugins/marketplace.json'] = new Uint8Array(await readFile(resolve(root, '.agents/plugins/marketplace.json')));
files['zenaico-plugin/README.md'] = new Uint8Array(await readFile(resolve(root, 'plugins/zenaico/README.md')));
files['zenaico-plugin/VERSION'] = strToU8(`${manifest.version}\n`);
await mkdir(resolve(root, 'release'), { recursive: true });
const path = resolve(root, `release/zenaico-plugin-${manifest.version}.zip`);
await writeFile(path, zipSync(files, { level: 6 }));
console.log(`Installable package: ${path}`);
