import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VisualEngine } from '../src/engine';
import { ArtifactStore } from '../src/store';
import { googleFixture, PNG } from './fixtures';

test('generation persists real image bytes, provenance, shared controls and source data across sessions', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-engine-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { providers, requests } = googleFixture();
  const engine = new VisualEngine(providers, new ArtifactStore(root));
  const source = { type: 'article' as const, value: 'Our battery offers 450 km of range and charges in 18 minutes.' };
  const output = await engine.generate(source, ['blueprint_classic'], { language: 'French', dataEntries: ['Range: 450 km'], lighting: 'studio', colorPalette: 'cyan and white', aspectRatio: '16:9' }, 2);
  assert.equal(output.completedCount, 2);
  assert.equal(output.partial, false);
  assert.equal(requests[1].config.imageConfig.imageSize, '4K');
  const artifact = output.artifacts[0];
  assert.equal(artifact.width, 1); // Fixture dimensions, never a fabricated 4K claim.
  assert.equal(artifact.model, 'gemini-3-pro-image');
  assert.match(artifact.prompt, /French/);
  assert.match(artifact.prompt, /cyan and white/);
  assert.match(artifact.prompt, /Range: 450 km/);
  assert.deepEqual(await readFile(artifact.filePath), PNG);
  const reopened = new ArtifactStore(root);
  assert.equal((await reopened.list()).total, 2);
  assert.deepEqual((await reopened.get(artifact.id)).source, source);
  assert.equal((await reopened.get(artifact.id)).concept?.title, artifact.title);
});

test('editing and review use the actual original image; edits retain ancestry and do not overwrite the source', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-edit-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { providers, requests } = googleFixture();
  const engine = new VisualEngine(providers, new ArtifactStore(root));
  const output = await engine.generate({ type: 'topic', value: 'Battery comparison' }, ['blueprint_classic']);
  const original = output.artifacts[0];
  const edited = await engine.edit(original.id, 'Make the labels more legible.');
  const editRequest = requests.at(-1);
  assert.equal(editRequest.contents.parts[0].inlineData.data, PNG.toString('base64'));
  assert.equal(editRequest.contents.parts[0].inlineData.mimeType, 'image/png');
  assert.notEqual(edited.id, original.id);
  assert.equal(edited.parentId, original.id);
  assert.equal(edited.options?.stylePreset?.id, 'blueprint_classic');
  assert.deepEqual(await readFile(original.filePath), PNG);
  await engine.review(edited.id, 'Range: 450 km');
  const reviewRequest = requests.at(-1);
  assert.equal(reviewRequest.contents.parts[1].inlineData.data, PNG.toString('base64'));
  assert.match(reviewRequest.contents.parts[0].text, /Range: 450 km/);
  assert.equal((await engine.detectText(edited.id)).detectedTexts[0].boundingBox.width, 0.3);
});

test('a failed batch preserves completed images and reports unattempted work', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-partial-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { providers } = googleFixture();
  const render = providers.render.bind(providers);
  let calls = 0;
  providers.render = async (...args) => { if (++calls === 2) throw new Error('Provider rate limit'); return render(...args); };
  const engine = new VisualEngine(providers, new ArtifactStore(root));
  const output = await engine.generate({ type: 'topic', value: 'Battery technology' }, undefined, {}, 4);
  assert.equal(calls, 2);
  assert.equal(output.completedCount, 1);
  assert.equal(output.requestedCount, 4);
  assert.equal(output.partial, true);
  assert.equal(output.errors[0].conceptIndex, 1);
  assert.equal((await engine.store.list()).total, 1);
});

test('library rejects traversal IDs and exports an offline collection with escaped titles', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-gallery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { providers } = googleFixture();
  const engine = new VisualEngine(providers, new ArtifactStore(root));
  const artifact = (await engine.generate({ type: 'topic', value: 'Battery infographic' })).artifacts[0];
  await assert.rejects(engine.store.get('../../secrets'), /Invalid artifact ID/);
  const exported = await engine.store.exportGallery([artifact.id], '<script>alert("x")</script>');
  const html = await readFile(exported.filePath, 'utf8');
  assert.match(html, /data:image\/png;base64,/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
