import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadSource, isPublicAddress, validatePublicURL } from '../src/sources';
import { buildConceptPrompt, DEFAULT_GENERATION_OPTIONS } from '../../services/infographicPrompts';
import { getSportsFeed } from '../src/sports';

test('source files use real content rather than only a filename; unsupported documents are explicit', async t => {
  const root = await mkdtemp(join(tmpdir(), 'zenaico-source-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'data.csv');
  await writeFile(path, 'metric,value\nrange,450 km\n');
  assert.equal(await loadSource({ type: 'file', value: path }), 'metric,value\nrange,450 km\n');
  await assert.rejects(loadSource({ type: 'file', value: join(root, 'input.pdf') }), /Extract text/);
  await assert.rejects(loadSource({ type: 'file', value: 'relative.md' }), /absolute path/);
});

test('unrelated numbered articles never acquire governance example facts or synthetic spending thresholds', () => {
  const prompt = buildConceptPrompt('1. ROOTS — Absorb water\nRoots grow below ground.\n2. LEAVES — Convert sunlight\nLeaves support photosynthesis.', DEFAULT_GENERATION_OPTIONS, 4);
  assert.match(prompt, /ROOTS/);
  assert.match(prompt, /LEAVES/);
  assert.doesNotMatch(prompt, /\$50|\$500|900,000|TRAINING|IDENTITY/);
});

test('article ingestion rejects private destinations and credentialed or non-HTTPS URLs', async () => {
  for (const address of ['127.0.0.1', '10.2.3.4', '192.168.1.1', '172.16.0.2', '169.254.169.254', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1']) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('8.8.8.8'), true);
  await assert.rejects(validatePublicURL('https://127.0.0.1/'), /Private/);
  await assert.rejects(validatePublicURL('http://example.com'), /public HTTPS/);
  await assert.rejects(validatePublicURL('https://user:password@example.com'), /without embedded credentials/);
});

test('sports feed retains dated source facts and does not substitute demo scores or roster assumptions', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (_url, _options) => Response.json({ events: [{ id: 'game1', date: '2026-10-01T22:00:00Z', name: 'Away at Home', status: { type: { state: 'pre', shortDetail: 'Scheduled' } }, competitions: [{ competitors: [
    { homeAway: 'home', team: { id: '1', displayName: 'Home', abbreviation: 'H' }, score: '0' },
    { homeAway: 'away', team: { id: '2', displayName: 'Away', abbreviation: 'A' }, score: '0' },
  ] }] }] });
  const output = await getSportsFeed({ sport: 'nfl', date: '20261001' });
  assert.equal(output.games.length, 1);
  assert.equal(output.games[0].status, 'UPCOMING');
  assert.equal(output.games[0].score, undefined);
  assert.equal(output.games[0].homeTeam.uniformBrand, undefined);
  assert.match(output.sourceURLs[0], /dates=20261001/);
  globalThis.fetch = async () => new Response('Unavailable', { status: 503 });
  await assert.rejects(getSportsFeed({ sport: 'nfl' }), /No demo scores/);
});
