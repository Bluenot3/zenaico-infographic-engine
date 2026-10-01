import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runCommand } from '../src/cli';
import { ArtifactStore } from '../src/store';
import { VisualEngine } from '../src/engine';
import { googleFixture, PNG } from './fixtures';

test('executable commands use the studio engine and finish images rather than returning ephemeral job handles', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-cli-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = googleFixture();
  const engine = new VisualEngine(fixture.providers, new ArtifactStore(root));
  const commands = (await runCommand('commands', {}, engine)).structuredContent!.commands as any[];
  assert.equal(commands.length, 18);
  assert.ok(!commands.some(command => command.name === 'get_job'));
  const generated = await runCommand('generate_infographics', { source: { type: 'article', value: 'Battery range: 450 km.' }, background: true }, engine);
  assert.notEqual(generated.isError, true);
  const artifact = (generated.structuredContent as any).artifacts[0];
  assert.deepEqual(await readFile(artifact.filePath), PNG);
  assert.equal((generated.structuredContent as any).job, undefined);
  const edited = await runCommand('edit_image', { image: artifact.id, instruction: 'Make labels readable.' }, engine);
  assert.equal((edited.structuredContent as any).artifact.parentId, artifact.id);
  const reopened = new VisualEngine(fixture.providers, new ArtifactStore(root));
  assert.equal(((await runCommand('list_artifacts', {}, reopened)).structuredContent as any).total, 2);
  await assert.rejects(runCommand('get_job', {}, engine), /persistent MCP server/);
});

test('the packaged executable starts without dependencies and reports missing credentials with a nonzero exit', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-skills-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'zenaico.mjs');
  await cp(resolve('plugins/zenaico/cli.mjs'), path);
  const env = { PATH: process.env.PATH, GEMINI_API_KEY: '', GOOGLE_API_KEY: '', OPENAI_API_KEY: '', ZENAICO_ENV_FILE: '', ZENAICO_OUTPUT_DIR: join(root, 'library') };
  const execute = promisify(execFile);
  const status = await execute(process.execPath, [path, 'get_status'], { cwd: root, env });
  assert.deepEqual(JSON.parse(status.stdout).providers, { google: false, openai: false });
  assert.equal(status.stderr, '');
  const request = join(root, 'request.json');
  await writeFile(request, JSON.stringify({ source: { type: 'topic', value: 'Battery technology' } }));
  await assert.rejects(execute(process.execPath, [path, 'generate_infographics', '--input', request], { cwd: root, env }), (error: any) => {
    assert.equal(error.code, 1);
    assert.equal(JSON.parse(error.stdout).isError, true);
    return true;
  });
});
