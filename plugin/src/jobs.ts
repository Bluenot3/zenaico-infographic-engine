import { randomUUID } from 'node:crypto';
import type { Artifact } from './store';
import { redactError } from './errors';

export interface Job {
  id: string; operation: string; status: 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
  createdAt: string; updatedAt: string; artifacts: Artifact[]; result?: Record<string, unknown>; error?: string;
}
interface RunningJob { job: Job; controller: AbortController; finished: Promise<void> }

/** Long image calls outlive a single MCP request; polling never holds a request over 15 seconds. */
export class JobRegistry {
  private jobs = new Map<string, RunningJob>();
  constructor(private secrets: (string | undefined)[] = []) {}
  start(operation: string, execute: (signal: AbortSignal, report: (artifacts: Artifact[]) => void) => Promise<Record<string, unknown>>): Job {
    if ([...this.jobs.values()].filter(r => r.job.status === 'running').length >= 2) throw new Error('Two image jobs are already running. Wait for one to finish or cancel it before starting another.');
    const now = new Date().toISOString();
    const job: Job = { id: randomUUID(), operation, status: 'running', createdAt: now, updatedAt: now, artifacts: [] };
    const controller = new AbortController();
    const report = (artifacts: Artifact[]) => { job.artifacts = [...artifacts]; job.updatedAt = new Date().toISOString(); };
    const finished = Promise.resolve().then(() => execute(controller.signal, report)).then(result => {
      job.result = result;
      if (Array.isArray(result.artifacts)) report(result.artifacts as Artifact[]);
      else if (result.artifact) report([result.artifact as Artifact]);
      job.status = controller.signal.aborted ? 'cancelled' : result.partial ? job.artifacts.length ? 'partial' : 'failed' : 'completed';
    }).catch(error => {
      job.status = controller.signal.aborted ? 'cancelled' : 'failed';
      job.error = redactError(error, this.secrets);
    }).finally(() => { job.updatedAt = new Date().toISOString(); });
    this.jobs.set(job.id, { job, controller, finished });
    // Bound metadata retained in memory; full image files remain in the persistent library.
    if (this.jobs.size > 100) for (const [id, record] of this.jobs) {
      if (record.job.status !== 'running') { this.jobs.delete(id); break; }
    }
    return structuredClone(job);
  }
  private find(id: string) {
    const record = this.jobs.get(id);
    if (!record) throw new Error('Job not found in this server session. Use list_artifacts to recover completed images after a restart.');
    return record;
  }
  async get(id: string, waitMs = 0): Promise<Job> {
    const record = this.find(id);
    if (waitMs && record.job.status === 'running') {
      let timer: ReturnType<typeof setTimeout>;
      try { await Promise.race([record.finished, new Promise<void>(resolve => { timer = setTimeout(resolve, Math.min(waitMs, 15000)); })]); }
      finally { clearTimeout(timer!); }
    }
    return structuredClone(record.job);
  }
  cancel(id: string): Job {
    const record = this.find(id);
    if (record.job.status === 'running') {
      record.controller.abort(new Error('Image job cancelled.'));
      record.job.status = 'cancelled'; record.job.updatedAt = new Date().toISOString();
    }
    return structuredClone(record.job);
  }
  cancelAll() { for (const id of this.jobs.keys()) this.cancel(id); }
}
