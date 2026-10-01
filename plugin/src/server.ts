import { timingSafeEqual } from 'node:crypto';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { createMcpServer, redactError } from './mcp';
import { createRuntimeEngine } from './runtime';

const engine = createRuntimeEngine(import.meta.url);

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
