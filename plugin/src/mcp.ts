import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { STYLE_PRESETS } from '../../constants';
import { buildImagePrompt } from '../../services/infographicPrompts';
import type { VisualEngine } from './engine';
import type { Artifact } from './store';
import { conceptSchema, optionsSchema, modelSettingsSchema, sourceSchema, stylesSchema, gameSchema } from './schemas';
import { capturePage, chromePath } from './capture';
import { getSportsFeed } from './sports';
import { redactError } from './errors';
export { redactError } from './errors';

export const PLUGIN_VERSION = '1.0.0';
function result(data: Record<string, unknown>): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
}
function artifactContent(artifact: Artifact) {
  return { type: 'resource_link' as const, uri: artifact.uri, name: artifact.title,
    description: `${artifact.width}×${artifact.height} ${artifact.mimeType}; saved to ${artifact.filePath}`, mimeType: artifact.mimeType };
}
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const create = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };
const common = { styles: stylesSchema, options: optionsSchema.optional(), models: modelSettingsSchema.optional() };
const count = z.number().int().min(1).max(4);
const reference = z.string().min(1).max(4096).describe('Saved artifact ID or absolute path to a PNG, JPEG, or WebP image.');
const id = z.string().uuid();
const background = z.boolean().default(true).describe('Start a background job (recommended for long image calls). Poll get_job until finished. Set false only when the client allows a sufficiently long tool timeout.');

export function createMcpServer(engine: VisualEngine) {
  const server = new McpServer({ name: 'zenaico', version: PLUGIN_VERSION }, {
    instructions: 'Zenaico uses the original infographic studio presets and domain harmonizer. Call get_status to check configuration and list_styles for available styles. Plan source-grounded concepts, render at high quality, then inspect actual images and refine them. Generated files and metadata persist in the artifact library. Never claim that a prompt creates a verified 8K image; report returned pixel dimensions and warnings. API credentials stay in the server environment. Image-model fallback is disabled unless explicitly requested.',
  });
  const safe = (handler: (args: any, signal: AbortSignal) => Promise<CallToolResult> | CallToolResult) => async (args: any, extra: { signal: AbortSignal }) => {
    try { return await handler(args, extra.signal); }
    catch (error) { return { isError: true, ...result({ error: redactError(error, [engine.providers.config.openaiApiKey, engine.providers.config.googleApiKey]) }) }; }
  };
  const withArtifact = (artifact: Artifact): CallToolResult => ({ ...result({ artifact }), content: [{ type: 'text', text: JSON.stringify({ artifact }, null, 2) }, artifactContent(artifact)] });

  server.registerTool('get_status', { title: 'Check Zenaico configuration', description: 'Check available providers, default models, local output directory and screenshot support without making paid API calls. Never returns keys.', inputSchema: {}, annotations: readOnly }, safe(() => result({
    version: PLUGIN_VERSION, providers: { google: Boolean(engine.providers.google), openai: Boolean(engine.providers.openai) },
    defaults: engine.providers.settings(), styleCount: STYLE_PRESETS.length,
    artifactDirectory: engine.store.root, screenshotSupport: Boolean(chromePath()),
    credentials: 'Set GEMINI_API_KEY and/or OPENAI_API_KEY in the server environment or ZENAICO_ENV_FILE.',
  })));
  server.registerTool('list_styles', { title: 'Browse visual styles', description: 'Browse the app’s original preset library, including cross-domain fusion, broadcast, luxury, blueprint, editorial and minimalist styles.',
    inputSchema: { category: z.string().optional(), query: z.string().optional() }, annotations: readOnly }, safe(args => {
    const styles = STYLE_PRESETS.filter(s => (!args.category || s.category.toLowerCase() === args.category.toLowerCase()) && (!args.query || `${s.name} ${s.category} ${s.id}`.toLowerCase().includes(args.query.toLowerCase())));
    return result({ styles, categories: [...new Set(STYLE_PRESETS.map(s => s.category))] });
  }));
  server.registerTool('preview_prompt', { title: 'Preview visual direction', description: 'Prepare the shared studio rendering prompt and full design controls without calling an image API.',
    inputSchema: { prompt: z.string().min(1).max(20000), ...common }, annotations: readOnly }, safe(args => {
    const options = engine.options(args.styles, args.options);
    return result({ prompt: buildImagePrompt(args.prompt, options.stylePromptSuffix!, options), options });
  }));
  server.registerTool('plan_infographics', { title: 'Plan infographic concepts', description: 'Create one to four distinct source-grounded infographic concepts from a topic, full article, text/CSV/JSON file, or public HTTPS article. Uses a paid text model; does not render images.',
    inputSchema: { source: sourceSchema, count: count.default(4), ...common }, annotations: create }, safe(async (args, signal) => result(await engine.plan(args.source, args.styles, args.options, args.count, args.models, signal))));
  server.registerTool('generate_infographics', { title: 'Generate publication-quality infographics', description: 'Plan and render one to four complete infographics using the original studio prompt engine. Each requested image incurs provider usage. Saves full-resolution images and metadata; reports actual model, dimensions, warnings and partial failures. Defaults to one image with fallback disabled.',
    inputSchema: { source: sourceSchema, count: count.default(1), background, ...common }, annotations: create }, safe(async (args, signal) => {
    if (args.background) {
      engine.providers.assertAvailable('image', args.models);
      return result({ job: engine.jobs.start('generate_infographics', (jobSignal, report) => engine.generate(args.source, args.styles, args.options, args.count, args.models, jobSignal, report)), nextStep: 'Poll get_job with this job ID and waitMs: 15000 until it finishes.' });
    }
    const data = await engine.generate(args.source, args.styles, args.options, args.count, args.models, signal);
    const response = result(data);
    response.content.push(...data.artifacts.map(artifactContent));
    if (!data.completedCount) response.isError = true;
    return response;
  }));
  server.registerTool('render_infographic', { title: 'Render a selected concept', description: 'Render a chosen concept or custom visual brief with exact text, blended presets and advanced design controls. Saves an image with prompt and provenance. Uses a paid image API.',
    inputSchema: { concept: conceptSchema, background, ...common }, annotations: create }, safe(async (args, signal) => {
    if (args.background) return result({ job: engine.jobs.start('render_infographic', async jobSignal => ({ artifact: await engine.render(args.concept, args.styles, args.options, args.models, jobSignal) })), nextStep: 'Poll get_job until finished.' });
    return withArtifact(await engine.render(args.concept, args.styles, args.options, args.models, signal));
  }));
  server.registerTool('edit_image', { title: 'Edit and refine an image', description: 'Edit the actual source image using a saved artifact or local file. Supports a same-size PNG mask under 4 MB; OpenAI edits fully transparent mask areas. Produces a new artifact and preserves the original. DALL-E 3 cannot edit.',
    inputSchema: { image: reference, instruction: z.string().min(1).max(20000), mask: reference.optional(), background, options: optionsSchema.optional(), models: modelSettingsSchema.optional() }, annotations: create }, safe(async (args, signal) => {
    if (args.background) return result({ job: engine.jobs.start('edit_image', async jobSignal => ({ artifact: await engine.edit(args.image, args.instruction, args.mask, args.options, args.models, jobSignal) })), nextStep: 'Poll get_job until finished.' });
    return withArtifact(await engine.edit(args.image, args.instruction, args.mask, args.options, args.models, signal));
  }));
  server.registerTool('enhance_image', { title: 'Enhance a graphic', description: 'Use the source image to improve legibility, repair artifacts and sharpen details while preserving source facts and composition. Uses a paid image-edit API; returned dimensions indicate the actual output resolution.',
    inputSchema: { image: reference, background, models: modelSettingsSchema.optional() }, annotations: create }, safe(async (args, signal) => {
    const instruction = 'Repair visible artifacts, enhance color depth and detail, and improve typography and label readability. Preserve every factual value.';
    if (args.background) return result({ job: engine.jobs.start('enhance_image', async jobSignal => ({ artifact: await engine.edit(args.image, instruction, undefined, {}, args.models, jobSignal) })), nextStep: 'Poll get_job until finished.' });
    return withArtifact(await engine.edit(args.image, instruction, undefined, {}, args.models, signal));
  }));
  server.registerTool('get_job', { title: 'Check image generation progress', description: 'Poll a background image job. Returns completed images as they become available, final results and explicit failures. Wait at most 15 seconds per call. Jobs are session-local; image files persist across server restarts.',
    inputSchema: { id, waitMs: z.number().int().min(0).max(15000).default(0) }, annotations: readOnly }, safe(async args => {
    const job = await engine.jobs.get(args.id, args.waitMs);
    const response = result({ job }); response.content.push(...job.artifacts.map(artifactContent));
    if (job.status === 'failed') response.isError = true;
    return response;
  }));
  server.registerTool('cancel_job', { title: 'Cancel an image job', description: 'Stop a running background job while preserving completed image files. Cancels pending provider requests; work already accepted by a provider may still incur usage.',
    inputSchema: { id }, annotations: { ...readOnly, readOnlyHint: false } }, safe(args => result({ job: engine.jobs.cancel(args.id) })));
  server.registerTool('review_image', { title: 'Review visual quality and factual fidelity', description: 'Inspect the actual image for spelling, legibility, charts, composition and artifacts. Compare with supplied expected content or the saved concept. Uses a paid vision model and reports verification limits.',
    inputSchema: { image: reference, expectedContent: z.string().max(200000).optional(), models: modelSettingsSchema.optional() }, annotations: create }, safe(async (args, signal) => result(await engine.review(args.image, args.expectedContent, args.models, signal))));
  server.registerTool('detect_text', { title: 'Read visible image text', description: 'Extract visible text from the actual image using a vision model. Returns normalized bounding boxes between 0 and 1. Does not guess unreadable labels.',
    inputSchema: { image: reference, models: modelSettingsSchema.optional() }, annotations: create }, safe(async (args, signal) => result(await engine.detectText(args.image, args.models, signal))));
  server.registerTool('suggest_data', { title: 'Extract data for an infographic', description: 'Extract concise facts and metrics from supplied source content. Returns no invented statistics for a bare topic. Uses a paid text model.',
    inputSchema: { source: sourceSchema, models: modelSettingsSchema.optional() }, annotations: create }, safe(async (args, signal) => result(await engine.suggestData(args.source, args.models, signal))));
  server.registerTool('sports_feed', { title: 'Fetch dated sports scores', description: 'Fetch real college football and NFL scoreboard data for a specified date; defaults to the current UTC date. Includes source URLs and fetch time. Never substitutes the app’s demo games. No AI API key required.',
    inputSchema: { sport: z.enum(['all', 'cfb', 'nfl', 'fsu']).default('all'), query: z.string().max(200).optional(), date: z.string().regex(/^\d{8}$/).optional().describe('Calendar date as YYYYMMDD.') }, annotations: { ...readOnly, openWorldHint: true } }, safe(async (args, signal) => result(await getSportsFeed(args, signal))));
  server.registerTool('plan_sports_infographics', { title: 'Plan balanced sports graphics', description: 'Create up to four concepts from a supplied or fetched game, using the app’s broadcast composition and domain harmonizer. Treats both teams equally and uses only supplied scores, statistics, rosters and uniform information. Render selected concepts with render_infographic.',
    inputSchema: { game: gameSchema, count: count.default(4), customAngle: z.string().max(4000).optional(), ...common }, annotations: create }, safe(async (args, signal) => result(await engine.sportsPlans(args.game, args.styles, args.options, args.count, args.customAngle, args.models, signal))));
  server.registerTool('capture_page', { title: 'Capture an app or website', description: 'Save one to four 1920×1080 viewport screenshots at successive scroll positions. Requires installed Chrome/Chromium. Public HTTPS URLs are supported; set allowLocalhost explicitly to capture your local app. Use edit_image to transform a screenshot into a campaign visual.',
    inputSchema: { url: z.string().url().max(4000), count: count.default(1), allowLocalhost: z.boolean().default(false) }, annotations: create }, safe(async (args, signal) => {
    const data = await capturePage(engine.store, args, signal);
    const response = result(data); response.content.push(...data.artifacts.map(artifactContent)); return response;
  }));
  server.registerTool('list_artifacts', { title: 'Browse saved visuals', description: 'List persistent generated images, edits and screenshots with file paths, prompts, provenance and timestamps.',
    inputSchema: { limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().min(0).default(0) }, annotations: readOnly }, safe(async args => result(await engine.store.list(args.limit, args.offset))));
  server.registerTool('get_artifact', { title: 'Open a saved visual', description: 'Retrieve a saved graphic and its provenance. Set includeImage to include the full image inline; large images are available through the returned MCP resource URI and local file path.',
    inputSchema: { id, includeImage: z.boolean().default(false) }, annotations: readOnly }, safe(async args => {
    const artifact = await engine.store.get(args.id);
    const response = withArtifact(artifact);
    if (args.includeImage) {
      const data = await readFile(artifact.filePath);
      if (data.length <= 8 * 1024 * 1024) response.content.push({ type: 'image', data: data.toString('base64'), mimeType: artifact.mimeType });
      else response.content.push({ type: 'text', text: 'Image exceeds the 8 MB inline limit. Open the full-resolution file or read its MCP resource.' });
    }
    return response;
  }));
  server.registerTool('export_collection', { title: 'Export a visual collection', description: 'Create a standalone HTML gallery embedding selected full-resolution images. Opens offline and can be printed to PDF. Does not convert generated raster graphics into editable vector or SVG artwork.',
    inputSchema: { artifactIds: z.array(id).min(1).max(8), title: z.string().max(300).optional() }, annotations: { ...create, openWorldHint: false } }, safe(async args => result(await engine.store.exportGallery(args.artifactIds, args.title))));
  server.registerTool('design_chat', { title: 'Consult the studio assistant', description: 'Discuss visual design and infographic composition with the configured text model. Preserves conversational context supplied by the caller.',
    inputSchema: { messages: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(20000) })).min(1).max(30), models: modelSettingsSchema.optional() }, annotations: create }, safe(async (args, signal) => result({ text: await engine.providers.text(args.messages.map((m: { role: string; text: string }) => `${m.role}: ${m.text}`).join('\n'), args.models, undefined, false, signal) })));

  server.registerResource('style-catalog', 'zenaico://styles', { mimeType: 'application/json', description: 'Original studio style presets' }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(STYLE_PRESETS, null, 2) }] }));
  server.registerResource('artifact-image', new ResourceTemplate('zenaico://artifacts/{id}/image', { list: async () => {
    const { artifacts } = await engine.store.list(50);
    return { resources: artifacts.map(a => ({ uri: a.uri, name: a.title, mimeType: a.mimeType })) };
  } }), { description: 'Full-resolution saved graphic' }, async (uri, variables) => {
    const artifact = await engine.store.get(String(variables.id));
    return { contents: [{ uri: uri.href, mimeType: artifact.mimeType, blob: (await readFile(artifact.filePath)).toString('base64') }] };
  });
  server.registerResource('artifact-metadata', new ResourceTemplate('zenaico://artifacts/{id}/metadata', { list: undefined }), { mimeType: 'application/json', description: 'Saved prompt and image provenance' }, async (uri, variables) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await engine.store.get(String(variables.id)), null, 2) }] }));
  return server;
}
