import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_GENERATION_OPTIONS } from '../../services/infographicPrompts';
import { Providers, imageSize } from '../src/providers';
import { googleFixture, openaiFixture, PNG } from './fixtures';

test('OpenAI generation preserves long prompts and uses high quality with exact model-appropriate aspect ratio', async () => {
  const { providers, requests } = openaiFixture();
  const prompt = 'Detailed source facts. '.repeat(300);
  await providers.render(prompt, { ...DEFAULT_GENERATION_OPTIONS, aspectRatio: '16:9' });
  assert.equal(requests[0].body.prompt, prompt);
  assert.equal(requests[0].body.quality, 'high');
  assert.equal(requests[0].body.size, '3840x2160');
  assert.equal(imageSize('dall-e-3', '16:9', '4K'), '1792x1024');
  assert.equal(imageSize('gpt-image-1.5', '16:9', '4K'), '1536x1024');
});

test('OpenAI edits submit actual image bytes and vision review receives actual pixels', async () => {
  const { providers, requests } = openaiFixture();
  await providers.render('Correct the headline.', DEFAULT_GENERATION_OPTIONS, {}, { data: PNG, mimeType: 'image/png' });
  assert.equal(requests[0].method, 'edit');
  assert.equal(requests[0].body.input_fidelity, 'high');
  assert.deepEqual(Buffer.from(await requests[0].body.image.arrayBuffer()), PNG);
  await providers.text('Review the image.', {}, { data: PNG, mimeType: 'image/png' });
  assert.equal(requests[1].body.messages[1].content[1].image_url.url, `data:image/png;base64,${PNG.toString('base64')}`);
  await assert.rejects(providers.render('Edit', DEFAULT_GENERATION_OPTIONS, { imageModel: 'dall-e-3' }, { data: PNG, mimeType: 'image/png' }), /cannot edit/);
});

test('Google respects selected models, resolution and actual MIME type', async () => {
  const { providers, requests } = googleFixture();
  await providers.render('A schematic.', DEFAULT_GENERATION_OPTIONS, { imageModel: 'gemini-3.1-flash-image', resolution: '2K' });
  assert.equal(requests[0].model, 'gemini-3.1-flash-image');
  assert.equal(requests[0].config.imageConfig.imageSize, '2K');
  await providers.text('Extract data.', { textModel: 'gemini-3-flash-preview' });
  assert.equal(requests[1].model, 'gemini-3-flash-preview');
  assert.throws(() => providers.settings({ provider: 'google', imageModel: 'gpt-image-2' }), /does not match/);
});

test('model fallback requires opt-in and reports the actual used model', async () => {
  const { providers, requests } = googleFixture(request => {
    if (request.model === 'gemini-3-pro-image') throw Object.assign(new Error('Model unavailable'), { status: 404 });
    return { candidates: [{ content: { parts: [{ inlineData: { data: PNG.toString('base64'), mimeType: 'image/png' } }] } }] };
  });
  await assert.rejects(providers.render('A diagram', DEFAULT_GENERATION_OPTIONS), /Model unavailable/);
  assert.equal(requests.length, 1);
  const image = await providers.render('A diagram', DEFAULT_GENERATION_OPTIONS, { allowFallback: true });
  assert.equal(image.requestedModel, 'gemini-3-pro-image');
  assert.equal(image.model, 'gemini-3.1-flash-image');
  assert.match(image.warnings[0], /explicitly permitted/);
});

test('authentication and empty-image errors never silently degrade or claim success', async () => {
  for (const status of [401, 403, 429]) {
    const { providers, requests } = googleFixture(() => { throw Object.assign(new Error('Provider rejected request'), { status }); });
    await assert.rejects(providers.render('A diagram', DEFAULT_GENERATION_OPTIONS, { allowFallback: true }), /Provider rejected/);
    assert.equal(requests.length, 1);
  }
  const { providers } = googleFixture(() => ({ candidates: [] }));
  await assert.rejects(providers.render('A diagram', DEFAULT_GENERATION_OPTIONS), /returned no image/);
  await assert.rejects(new Providers({ defaults: {} }).text('Hello'), /API_KEY is missing/);
});

test('provider preflight catches missing image credentials before paid planning work', () => {
  const { client } = openaiFixture();
  const providers = new Providers({ defaults: { provider: 'auto' } }, { openai: client });
  assert.throws(() => providers.assertAvailable('image', { imageModel: 'gemini-3-pro-image' }), /GEMINI_API_KEY is missing/);
  assert.doesNotThrow(() => providers.assertAvailable('text'));
});
