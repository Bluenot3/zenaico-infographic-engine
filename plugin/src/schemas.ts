import { z } from 'zod';

const text = z.string().trim().min(1);
export const conceptSchema = z.object({
  title: text.max(300), points: z.array(text.max(4000)).min(1).max(20), imagePrompt: text.max(32000),
});
export const optionsSchema = z.object({
  targetAudience: z.enum(['general', 'students', 'experts', 'children']).optional(),
  tone: z.enum(['professional', 'casual', 'humorous', 'inspirational']).optional(),
  keyElements: z.string().max(4000).optional(), excludeElements: z.string().max(4000).optional(),
  colorPalette: z.string().max(1000).optional(),
  layout: z.enum(['centered', 'asymmetrical', 'minimalist', 'data-heavy']).optional(),
  numPoints: z.number().int().min(1).max(12).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional(), language: text.max(100).optional(),
  includeDataVis: z.boolean().optional(), dataEntries: z.array(text.max(4000)).max(50).optional(),
  positivePrompt: z.string().max(4000).optional(), negativePrompt: z.string().max(4000).optional(),
  typographyStyle: z.enum(['modern-sans', 'classic-serif', 'futuristic-tech', 'handwritten-organic', 'bold-display']).optional(),
  visualComplexity: z.enum(['minimal', 'balanced', 'dense', 'ultra-detailed']).optional(),
  narrativePath: z.enum(['linear', 'radial', 'modular', 'flow']).optional(),
  lighting: z.enum(['studio', 'cinematic', 'natural', 'neon-cyberpunk', 'golden-hour']).optional(),
  renderEngine: z.enum(['unreal-engine-5', 'octane-render', 'v-ray', 'digital-painting', 'vector-art']).optional(),
}).strict();
export const modelSettingsSchema = z.object({
  provider: z.enum(['auto', 'google', 'openai', 'hybrid']).optional(),
  imageModel: text.max(100).optional(), textModel: text.max(100).optional(),
  resolution: z.enum(['1K', '2K', '4K']).optional(),
  allowFallback: z.boolean().optional().describe('Explicitly allow a lower-cost image model if the selected model is unavailable. Defaults to false.'),
}).strict();
export const sourceSchema = z.object({
  type: z.enum(['topic', 'article', 'file', 'url']),
  value: text.max(200000).describe('Topic, full article text, absolute UTF-8 text/Markdown/CSV/JSON file path, or public HTTPS article URL.'),
}).strict();
export const stylesSchema = z.array(text.max(100)).min(1).max(4).optional()
  .describe('Style preset IDs or names from list_styles; up to four styles can be blended.');

const teamSchema = z.object({
  name: text, shortName: text, rank: z.number().optional(), record: z.string().optional(),
  color: z.string().optional(), logoText: z.string().optional(), uniformBrand: z.string().optional(),
  uniformStyle: z.string().optional(),
});
const pairNumber = z.object({ home: z.number(), away: z.number() });
const pairString = z.object({ home: z.string(), away: z.string() });
export const gameSchema = z.object({
  id: text, sport: z.enum(['CFB', 'NFL', 'OTHER']), league: text,
  homeTeam: teamSchema, awayTeam: teamSchema, score: pairNumber.optional(),
  status: z.enum(['FINAL', 'LIVE', 'UPCOMING']), gameDate: text, quarterOrTime: z.string(),
  headline: z.string(), summary: z.string(), venue: z.string().optional(),
  stadiumName: z.string().optional(), stadiumLocation: z.string().optional(), broadcast: z.string().optional(),
  keyStats: z.array(z.object({ label: text, value: text })),
  isFloridaState: z.boolean().optional(), isFeatured: z.boolean().optional(), turningPoint: z.string().optional(),
  webImageReferences: z.array(z.string()).optional(),
  boxScore: z.object({
    q1: pairNumber.optional(), q2: pairNumber.optional(), q3: pairNumber.optional(), q4: pairNumber.optional(),
    totalYards: pairString.optional(), passYards: pairString.optional(), rushYards: pairString.optional(),
    turnovers: pairNumber.optional(), topPerformers: z.array(z.string()).optional(),
  }).optional(),
});
export const detectedTextSchema = z.object({
  id: text, text: z.string(),
  boundingBox: z.object({
    x: z.number().min(0).max(1), y: z.number().min(0).max(1),
    width: z.number().min(0).max(1), height: z.number().min(0).max(1),
  }),
});
export type ModelSettings = z.infer<typeof modelSettingsSchema>;
export type Source = z.infer<typeof sourceSchema>;
