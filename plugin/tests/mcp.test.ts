import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMcpServer, redactError } from '../src/mcp';
import { VisualEngine } from '../src/engine';
import { ArtifactStore } from '../src/store';
import { Providers } from '../src/providers';
import { googleFixture, PNG } from './fixtures';

async function connect(engine: VisualEngine, t: any) {
  const server = createMcpServer(engine);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'zenaico-test', version: '1.0.0' });
  await client.connect(clientTransport);
  t.after(async () => { await client.close(); await server.close(); });
  return client;
}

test('MCP clients discover tools and can generate, edit, inspect, read resources and export a collection', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-mcp-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { providers } = googleFixture();
  const client = await connect(new VisualEngine(providers, new ArtifactStore(root)), t);
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 20);
  assert.equal(tools.tools.find(tool => tool.name === 'generate_infographics')?.annotations?.destructiveHint, false);
  const generation = await client.callTool({ name: 'generate_infographics', arguments: { background: false, source: { type: 'article', value: 'Battery range: 450 km.' } } });
  assert.equal(generation.isError, undefined);
  const artifact = (generation.structuredContent as any).artifacts[0];
  assert.equal(generation.content[1].type, 'resource_link');
  const image = await client.readResource({ uri: artifact.uri });
  assert.equal((image.contents[0] as any).blob, PNG.toString('base64'));
  const metadata = await client.readResource({ uri: `zenaico://artifacts/${artifact.id}/metadata` });
  assert.equal(JSON.parse((metadata.contents[0] as any).text).model, 'gemini-3-pro-image');
  const edited = await client.callTool({ name: 'edit_image', arguments: { background: false, image: artifact.id, instruction: 'Improve the label contrast.' } });
  assert.equal((edited.structuredContent as any).artifact.parentId, artifact.id);
  const review = await client.callTool({ name: 'review_image', arguments: { image: artifact.id } });
  assert.deepEqual((review.structuredContent as any).suggestions, []);
  const gallery = await client.callTool({ name: 'export_collection', arguments: { artifactIds: [artifact.id] } });
  assert.match((gallery.structuredContent as any).filePath, /\.html$/);
  assert.equal((await client.listResources()).resources.some(r => r.uri === artifact.uri), true);
});

test('MCP initializes without keys and reports explicit, redacted tool errors instead of false success', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-no-key-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const client = await connect(new VisualEngine(new Providers({ defaults: {} }), new ArtifactStore(root)), t);
  const status = await client.callTool({ name: 'get_status', arguments: {} });
  assert.deepEqual((status.structuredContent as any).providers, { google: false, openai: false });
  const failed = await client.callTool({ name: 'generate_infographics', arguments: { background: false, source: { type: 'topic', value: 'Batteries' } } });
  assert.equal(failed.isError, true);
  assert.match((failed.structuredContent as any).error, /API_KEY is missing/);
  const invalid = await client.callTool({ name: 'preview_prompt', arguments: { prompt: 'A diagram', styles: ['unknown-style'] } });
  assert.equal(invalid.isError, true);
  assert.match((invalid.structuredContent as any).error, /Unknown style/);
  assert.equal(redactError(new Error('Provider rejected private-secret'), ['private-secret']), 'Provider rejected [REDACTED]');
});

test('MCP background generation completes through progress polling and returns image resources', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-job-mcp-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { providers } = googleFixture();
  const client = await connect(new VisualEngine(providers, new ArtifactStore(root)), t);
  const started = await client.callTool({ name: 'generate_infographics', arguments: { source: { type: 'article', value: 'Battery range: 450 km.' } } });
  const jobId = (started.structuredContent as any).job.id;
  assert.equal((started.structuredContent as any).job.status, 'running');
  const polled = await client.callTool({ name: 'get_job', arguments: { id: jobId, waitMs: 1000 } });
  const job = (polled.structuredContent as any).job;
  assert.equal(job.status, 'completed');
  assert.equal(job.artifacts.length, 1);
  assert.equal(polled.content[1].type, 'resource_link');
  assert.equal((await client.readResource({ uri: job.artifacts[0].uri })).contents[0].mimeType, 'image/png');
});
