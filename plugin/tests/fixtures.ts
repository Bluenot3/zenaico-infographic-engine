import type { GoogleGenAI } from '@google/genai';
import type OpenAI from 'openai';
import { Providers } from '../src/providers';

export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jLZkAAAAASUVORK5CYII=', 'base64');
export const concept = { title: 'Battery comparison', points: ['Range: 450 km', 'Charge time: 18 min'], imagePrompt: 'A clear technical comparison with exact range and charge time labels.' };
export function googleFixture(overrides?: (request: any) => any) {
  const requests: any[] = [];
  const google = { models: { generateContent: async (request: any) => {
    requests.push(request);
    if (overrides) return overrides(request);
    if (request.config?.responseModalities) return { candidates: [{ content: { parts: [{ inlineData: { data: PNG.toString('base64'), mimeType: 'image/png' } }] } }] };
    const prompt = request.contents.parts.find((p: any) => p.text)?.text || '';
    if (prompt.includes('"verificationLimits"')) return { text: JSON.stringify({ suggestions: [], strengths: ['Readable labels'], verificationLimits: ['External facts were not independently verified'] }) };
    if (prompt.includes('"detectedTexts"')) return { text: JSON.stringify({ detectedTexts: [{ id: 'label1', text: '450 km', boundingBox: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 } }] }) };
    if (prompt.includes('"suggestedData"')) return { text: JSON.stringify({ suggestedData: ['Range: 450 km'] }) };
    const count = Number(prompt.match(/exactly (\d)/)?.[1] || 1);
    return { text: JSON.stringify({ infographics: Array.from({ length: count }, (_, index) => ({ ...concept, title: `${concept.title} ${index + 1}` })) }) };
  } } } as unknown as GoogleGenAI;
  return { providers: new Providers({ defaults: { provider: 'google' } }, { google }), requests, google };
}
export function openaiFixture() {
  const requests: { method: string; body: any }[] = [];
  const image = async (method: string, body: any) => { requests.push({ method, body }); return { data: [{ b64_json: PNG.toString('base64') }] }; };
  const client = {
    images: { generate: (body: any) => image('generate', body), edit: (body: any) => image('edit', body) },
    chat: { completions: { create: async (body: any) => {
      requests.push({ method: 'chat', body });
      return { choices: [{ message: { content: JSON.stringify({ suggestions: [], strengths: [], verificationLimits: ['No external verification'] }) } }] };
    } } },
  } as unknown as OpenAI;
  return { providers: new Providers({ defaults: { provider: 'openai' } }, { openai: client }), requests, client };
}
