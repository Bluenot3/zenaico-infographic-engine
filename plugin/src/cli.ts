import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpServer, PLUGIN_VERSION, redactError } from './mcp';
import { createRuntimeEngine } from './runtime';
import type { VisualEngine } from './engine';

const imageCommands = new Set(['generate_infographics', 'render_infographic', 'edit_image', 'enhance_image']);
const sessionCommands = new Set(['get_job', 'cancel_job']);
const MAX_INPUT_BYTES = 1024 * 1024;

// Reuse the existing engine and validated command handlers in-process. This
// executable opens no HTTP endpoint and needs no external MCP connection.
export async function runCommand(name: string, args: Record<string, unknown>, engine: VisualEngine, signal?: AbortSignal): Promise<CallToolResult> {
  if (sessionCommands.has(name)) throw new Error('CLI image commands finish in the current process. Use the host execution session to wait or cancel; job handles require a persistent MCP server.');
  const server = createMcpServer(engine);
  const client = new Client({ name: 'zenaico-cli', version: PLUGIN_VERSION });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    if (name === 'commands') {
      const commands = (await client.listTools()).tools.filter(tool => !sessionCommands.has(tool.name));
      return { content: [{ type: 'text', text: JSON.stringify({ commands }) }], structuredContent: { commands } };
    }
    return await client.callTool({ name, arguments: imageCommands.has(name) ? { ...args, background: false } : args }, undefined, { timeout: 20 * 60 * 1000, signal }) as CallToolResult;
  } finally {
    await client.close();
    await server.close();
  }
}

async function input(path?: string) {
  const chunks: Buffer[] = [];
  let size = 0;
  if (path) {
    const data = await readFile(path);
    if (data.length > MAX_INPUT_BYTES) throw new Error('Command input exceeds 1 MB.');
    chunks.push(data);
  } else {
    for await (const chunk of process.stdin) {
      const data = Buffer.from(chunk); size += data.length;
      if (size > MAX_INPUT_BYTES) throw new Error('Command input exceeds 1 MB.');
      chunks.push(data);
    }
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  const value: unknown = text ? JSON.parse(text) : {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Command input must be a JSON object.');
  return value as Record<string, unknown>;
}

async function main() {
  const [name, flag, path, ...rest] = process.argv.slice(2);
  if (!name || name === '--help') {
    process.stdout.write('Usage: node zenaico.mjs <command> [--input /absolute/path/request.json]\nCommands: run "commands" to list schemas; "get_status" checks providers. Other input may be sent as JSON on stdin.\n');
    return;
  }
  if ((flag && (flag !== '--input' || !path)) || rest.length) throw new Error('Use a command followed by --input <JSON file>, or JSON on stdin.');
  const args = flag ? await input(path) : ['commands', 'get_status'].includes(name) ? {} : await input();
  const engine = createRuntimeEngine(import.meta.url);
  const abort = new AbortController();
  const stop = () => { process.exitCode = 130; abort.abort(); engine.jobs.cancelAll(); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    const response = await runCommand(name, args, engine, abort.signal);
    const output = { ...(response.structuredContent || {}), ...(response.isError ? { isError: true } : {}) };
    const images = response.content.filter(item => item.type === 'image');
    if (images.length) Object.assign(output, { images });
    process.stdout.write(`${JSON.stringify(output)}\n`);
    if (response.isError) process.exitCode ||= 1;
  } finally {
    process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stdout.write(`${JSON.stringify({ isError: true, error: redactError(error, [process.env.OPENAI_API_KEY, process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY]) })}\n`);
    process.exitCode ||= 1;
  });
}
