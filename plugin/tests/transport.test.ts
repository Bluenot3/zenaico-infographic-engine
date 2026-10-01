import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';
import { createServer as createHTTPServer } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { chromePath } from '../src/capture';

const bundle = resolve(dirname(fileURLToPath(import.meta.url)), '../../plugins/zenaico/server.mjs');
async function tempPackage(t: any) {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-standalone-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'server.mjs');
  await cp(bundle, path);
  return { root, path };
}
function environment(root: string) {
  return { PATH: process.env.PATH || '', ZENAICO_OUTPUT_DIR: join(root, 'artifacts'),
    GEMINI_API_KEY: '', GOOGLE_API_KEY: '', OPENAI_API_KEY: '', ZENAICO_PROVIDER: 'auto', ZENAICO_ENV_FILE: '',
    ZENAICO_CHROME_PATH: chromePath() || '', ZENAICO_BROWSER_NO_SANDBOX: 'true' };
}
test('the standalone bundle initializes from a folder with no node_modules and speaks real stdio MCP', async t => {
  const { root, path } = await tempPackage(t);
  const transport = new StdioClientTransport({ command: process.execPath, args: [path], cwd: root, env: environment(root), stderr: 'pipe' });
  let stderr = '';
  transport.stderr?.on('data', data => { stderr += data.toString(); });
  const client = new Client({ name: 'standalone-smoke', version: '1.0.0' });
  t.after(() => client.close());
  await client.connect(transport);
  assert.equal(client.getServerVersion()?.name, 'zenaico');
  assert.equal((await client.listTools()).tools.length, 20);
  const status = await client.callTool({ name: 'get_status', arguments: {} });
  assert.deepEqual((status.structuredContent as any).providers, { google: false, openai: false });
  assert.ok((status.structuredContent as any).styleCount > 40);
  assert.equal(stderr, '');
});

test('the standalone HTTP transport authenticates requests and handles tool calls', async t => {
  const { root, path } = await tempPackage(t);
  const reservation = createNetServer();
  await new Promise<void>(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = (reservation.address() as { port: number }).port;
  await new Promise<void>((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  const child = spawn(process.execPath, [path, '--http'], { cwd: root, env: { ...environment(root), ZENAICO_MCP_PORT: String(port), ZENAICO_MCP_TOKEN: 'fixture-private-token' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('HTTP server startup timed out')), 10000);
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`HTTP server exited with ${code}`)); });
    child.stderr.on('data', data => { if (data.toString().includes('listening at')) { clearTimeout(timeout); resolve(); } });
  });
  const endpoint = `http://127.0.0.1:${port}/mcp`;
  assert.equal((await fetch(endpoint, { method: 'POST' })).status, 401);
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), { requestInit: { headers: { authorization: 'Bearer fixture-private-token' } } });
  const client = new Client({ name: 'http-smoke', version: '1.0.0' });
  t.after(() => client.close());
  await client.connect(transport);
  const styles = await client.callTool({ name: 'list_styles', arguments: { category: 'Technical' } });
  assert.ok((styles.structuredContent as any).styles.length > 0);
  assert.ok((await client.listResources()).resources.some(r => r.uri === 'zenaico://styles'));
});

test('the packaged screenshot tool captures actual local page pixels without external dependencies', { skip: !chromePath() }, async t => {
  const { root, path } = await tempPackage(t);
  const page = createHTTPServer((_request, response) => { response.setHeader('content-type', 'text/html'); response.end('<!doctype html><title>Zenaico screenshot fixture</title><body style="background:#102449;color:white"><h1>Screenshot fixture</h1><p>Actual page pixels, not a generated substitute.</p></body>'); });
  await new Promise<void>(resolve => page.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>((resolve, reject) => page.close(error => error ? reject(error) : resolve())));
  const port = (page.address() as { port: number }).port;
  const transport = new StdioClientTransport({ command: process.execPath, args: [path], cwd: root, env: environment(root), stderr: 'pipe' });
  const client = new Client({ name: 'capture-smoke', version: '1.0.0' });
  t.after(() => client.close());
  await client.connect(transport);
  const captured = await client.callTool({ name: 'capture_page', arguments: { url: `http://127.0.0.1:${port}`, allowLocalhost: true } }, undefined, { timeout: 60000 });
  assert.notEqual(captured.isError, true, JSON.stringify(captured));
  const artifact = (captured.structuredContent as any).artifacts[0];
  assert.equal(artifact.width, 1920);
  assert.equal(artifact.height, 1080);
  assert.equal(artifact.provider, 'browser');
  assert.match(artifact.title, /Zenaico screenshot fixture/);
  assert.equal((await client.readResource({ uri: artifact.uri })).contents[0].mimeType, 'image/png');
});
