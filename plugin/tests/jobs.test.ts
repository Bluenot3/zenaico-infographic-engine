import test from 'node:test';
import assert from 'node:assert/strict';
import { JobRegistry } from '../src/jobs';

test('background work returns an immediate handle and polling retrieves its eventual result', async () => {
  const registry = new JobRegistry();
  let finish!: (value: Record<string, unknown>) => void;
  const pending = new Promise<Record<string, unknown>>(resolve => { finish = resolve; });
  const initial = registry.start('fixture-render', async () => pending);
  assert.equal(initial.status, 'running');
  assert.equal((await registry.get(initial.id)).result, undefined);
  finish({ artifacts: [], completedCount: 1 });
  const completed = await registry.get(initial.id, 1000);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.result?.completedCount, 1);
});

test('job failures redact provider secrets and report a failed state instead of success', async () => {
  const registry = new JobRegistry(['private-provider-secret']);
  const job = registry.start('fixture-error', async () => { throw new Error('Rejected private-provider-secret'); });
  const failed = await registry.get(job.id, 1000);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.error, 'Rejected [REDACTED]');
});

test('concurrent image work is bounded and explicit cancellation aborts the request', async () => {
  const registry = new JobRegistry();
  const work = async (signal: AbortSignal): Promise<Record<string, unknown>> => {
    signal.throwIfAborted();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  };
  const first = registry.start('first', work);
  const second = registry.start('second', work);
  assert.throws(() => registry.start('third', work), /already running/);
  assert.equal(registry.cancel(first.id).status, 'cancelled');
  assert.equal((await registry.get(first.id, 1000)).status, 'cancelled');
  registry.cancel(second.id);
  assert.equal((await registry.get(second.id, 1000)).status, 'cancelled');
});
