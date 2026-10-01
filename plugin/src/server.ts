import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { Providers } from './providers';
import { ArtifactStore } from './store';
import { VisualEngine } from './engine';
import { createMcpServer, redactError } from './mcp';
import { modelSettingsSchema } from './schemas';
import { configureNetwork } from './network';

const entryDirectory = dirname(fileURLToPath(import.meta.url));
const root = basename(entryDirectory) === 'src' && basename(dirname(entryDirectory)) === 'plugin' ? resolve(entryDirectory, '../..') : entryDirectory;
const envFile = process.env.ZENAICO_ENV_FILE || join(process.env.PLUGIN_DATA || root, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);
else if (process.env.ZENAICO_ENV_FILE) throw new Error('ZENAICO_ENV_FILE points to a missing file.');
configureNetwork();

const engine = new VisualEngine(new Providers({
  googleApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  defaults: modelSettingsSchema.parse({
    provider: process.env.ZENAICO_PROVIDER || 'auto', imageModel: process.env.ZENAICO_IMAGE_MODEL || undefined,
    textModel: process.env.ZENAICO_TEXT_MODEL || undefined, resolution: process.env.ZENAICO_RESOLUTION || '4K',
    allowFallback: process.env.ZENAICO_ALLOW_FALLBACK === 'true',
  }),
}), new ArtifactStore(process.env.ZENAICO_OUTPUT_DIR || join(process.env.PLUGIN_DATA || process.cwd(), 'zenaico-output')));

async function main() {
  if (!process.argv.includes('--http')) {
    const server = createMcpServer(engine);
    await server.connect(new StdioServerTransport());
    const close = () => { engine.jobs.cancelAll(); void server.close().then(() => process.exit(0)); };
    process.once('SIGINT', close); process.once('SIGTERM', close);
    return;
  }
  const host = process.env.ZENAICO_MCP_HOST || '127.0.0.1';
  const port = Number(process.env.ZENAICO_MCP_PORT || 3333);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid ZENAICO_MCP_PORT.');
  const token = process.env.ZENAICO_MCP_TOKEN;
  if (!['127.0.0.1', '::1', 'localhost'].includes(host) && !token) throw new Error('ZENAICO_MCP_TOKEN is required when binding beyond localhost.');
  const app = createMcpExpressApp({ host });
  if (token) app.use((req, res, next) => {
    const supplied = Buffer.from(req.headers.authorization || '');
    const expected = Buffer.from(`Bearer ${token}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) { res.status(401).json({ error: 'Authentication required.' }); return; }
    next();
  });
  app.post('/mcp', async (req, res) => {
    const server = createMcpServer(engine);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { void transport.close(); void server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
  app.get('/health', (_req, res) => { res.json({ status: 'ok', service: 'zenaico' }); });
  const listener = app.listen(port, host, () => { process.stderr.write(`Zenaico MCP listening at http://${host}:${port}/mcp\n`); });
  listener.on('error', error => { process.stderr.write(`${redactError(error, [token])}\n`); process.exitCode = 1; });
  const close = () => { engine.jobs.cancelAll(); listener.close(() => process.exit(0)); };
  process.once('SIGINT', close); process.once('SIGTERM', close);
}
main().catch(error => {
  process.stderr.write(`Zenaico startup failed: ${redactError(error, [process.env.OPENAI_API_KEY, process.env.GEMINI_API_KEY, process.env.ZENAICO_MCP_TOKEN])}\n`);
  process.exitCode = 1;
});
