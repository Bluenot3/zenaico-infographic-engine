import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { Providers } from './providers';
import { ArtifactStore } from './store';
import { VisualEngine } from './engine';
import { modelSettingsSchema } from './schemas';
import { configureNetwork } from './network';

export function createRuntimeEngine(entryUrl: string) {
  const entryDirectory = dirname(fileURLToPath(entryUrl));
  const root = basename(entryDirectory) === 'src' && basename(dirname(entryDirectory)) === 'plugin' ? resolve(entryDirectory, '../..') : entryDirectory;
  const envFile = process.env.ZENAICO_ENV_FILE || join(process.env.PLUGIN_DATA || root, '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  else if (process.env.ZENAICO_ENV_FILE) throw new Error('ZENAICO_ENV_FILE points to a missing file.');
  configureNetwork();
  return new VisualEngine(new Providers({
    googleApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    defaults: modelSettingsSchema.parse({
      provider: process.env.ZENAICO_PROVIDER || 'auto', imageModel: process.env.ZENAICO_IMAGE_MODEL || undefined,
      textModel: process.env.ZENAICO_TEXT_MODEL || undefined, resolution: process.env.ZENAICO_RESOLUTION || '4K',
      allowFallback: process.env.ZENAICO_ALLOW_FALLBACK === 'true',
    }),
  }), new ArtifactStore(process.env.ZENAICO_OUTPUT_DIR || join(process.env.PLUGIN_DATA || process.cwd(), 'zenaico-output')));
}
