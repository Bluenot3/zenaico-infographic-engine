import { mkdir, readFile, readdir, realpath, rename, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { imageSize } from 'image-size';
import { identifyImage, type ImageData, type RenderedImage } from './providers';
import type { GenerationOptions, InfographicContent } from '../../types';

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
export interface Artifact {
  id: string; title: string; createdAt: string; filePath: string; metadataPath: string;
  uri: string; mimeType: string; width: number; height: number;
  provider: string; model: string; requestedModel: string; requestedResolution: string;
  warnings: string[]; prompt: string; concept?: InfographicContent;
  options?: GenerationOptions; source?: { type: string; value: string }; parentId?: string;
}
export class ArtifactStore {
  readonly root: string;
  constructor(root: string) { this.root = resolve(root); }
  private folder(id: string) {
    if (!idPattern.test(id)) throw new Error('Invalid artifact ID. Use an ID returned by generate_infographics or list_artifacts.');
    return join(this.root, id);
  }
  async save(image: RenderedImage, details: Pick<Artifact, 'title' | 'prompt'> & Partial<Pick<Artifact, 'concept' | 'options' | 'source' | 'parentId'>>): Promise<Artifact> {
    if (!image.data.length || image.data.length > MAX_IMAGE_BYTES) throw new Error('Image must be between 1 byte and 30 MB.');
    const mimeType = identifyImage(image.data);
    const dimensions = imageSize(image.data);
    const id = randomUUID();
    const folder = this.folder(id);
    await mkdir(folder, { recursive: true, mode: 0o700 });
    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
    const filePath = join(folder, `image.${extension}`);
    const metadataPath = join(folder, 'metadata.json');
    const artifact: Artifact = {
      id, createdAt: new Date().toISOString(), filePath, metadataPath, uri: `zenaico://artifacts/${id}/image`,
      mimeType, width: dimensions.width, height: dimensions.height, provider: image.provider,
      model: image.model, requestedModel: image.requestedModel, requestedResolution: image.requestedResolution,
      warnings: image.warnings, ...details,
    };
    await writeFile(filePath, image.data, { flag: 'wx', mode: 0o600 });
    await writeFile(`${metadataPath}.tmp`, JSON.stringify(artifact, null, 2), { flag: 'wx', mode: 0o600 });
    await rename(`${metadataPath}.tmp`, metadataPath);
    return artifact;
  }
  async get(id: string): Promise<Artifact> {
    const value = JSON.parse(await readFile(join(this.folder(id), 'metadata.json'), 'utf8')) as Artifact;
    if (value.id !== id) throw new Error('Artifact metadata ID does not match.');
    // Resolve file names ourselves; do not trust paths from editable metadata.
    const extension = value.mimeType === 'image/jpeg' ? 'jpg' : value.mimeType === 'image/webp' ? 'webp' : 'png';
    return { ...value, filePath: join(this.folder(id), `image.${extension}`), metadataPath: join(this.folder(id), 'metadata.json') };
  }
  async list(limit = 20, offset = 0): Promise<{ artifacts: Artifact[]; total: number }> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const entries = await readdir(this.root);
    const artifacts: Artifact[] = [];
    for (const id of entries.filter(id => idPattern.test(id))) {
      try { artifacts.push(await this.get(id)); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    artifacts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { artifacts: artifacts.slice(offset, offset + limit), total: artifacts.length };
  }
  async loadImage(reference: string): Promise<ImageData & { artifact?: Artifact }> {
    const artifact = idPattern.test(reference) ? await this.get(reference) : undefined;
    const filePath = artifact?.filePath || reference;
    if (!isAbsolute(filePath)) throw new Error('Use an artifact ID or an absolute image file path.');
    const canonical = await realpath(filePath);
    const info = await stat(canonical);
    if (!info.isFile() || !info.size || info.size > MAX_IMAGE_BYTES) throw new Error('Image must be a regular file smaller than 30 MB.');
    const data = await readFile(canonical);
    if (data.length > MAX_IMAGE_BYTES) throw new Error('Image exceeds 30 MB.');
    return { data, mimeType: identifyImage(data), artifact };
  }
  async exportGallery(ids: string[], title = 'Zenaico Visual Collection') {
    const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const artifacts = await Promise.all(ids.map(id => this.get(id)));
    const cards = await Promise.all(artifacts.map(async a => `<figure><img src="data:${a.mimeType};base64,${(await readFile(a.filePath)).toString('base64')}" alt="${escape(a.title)}"><figcaption><h2>${escape(a.title)}</h2><p>${escape(a.model)} · ${a.width} × ${a.height}</p></figcaption></figure>`));
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{margin:0;background:#0b1020;color:#edf2ff;font:16px system-ui,sans-serif;padding:clamp(20px,4vw,64px)}main{max-width:1600px;margin:auto}h1{font-size:clamp(24px,4vw,48px)}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,480px),1fr));gap:28px}figure{margin:0;background:#151c30;border:1px solid #2b3856;border-radius:20px;overflow:hidden}img{width:100%;height:auto;display:block}figcaption{padding:20px}h2{font-size:20px;margin:0 0 8px}p{color:#a7b4ce;margin:0}@media print{body{background:white;color:black}figure{break-inside:avoid;background:white}section{display:block}figure{margin-bottom:24px}}</style><main><h1>${escape(title)}</h1><section>${cards.join('')}</section></main></html>`;
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const filePath = join(this.root, `collection-${randomUUID()}.html`);
    await writeFile(filePath, html, { flag: 'wx', mode: 0o600 });
    return { filePath, artifactIds: ids, format: 'html', printToPDF: true };
  }
}
