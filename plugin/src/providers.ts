import OpenAI, { toFile } from 'openai';
import { GoogleGenAI, Modality } from '@google/genai';
import type { GenerationOptions } from '../../types';
import type { ModelSettings } from './schemas';

export interface ImageData { data: Buffer; mimeType: 'image/png' | 'image/jpeg' | 'image/webp' }
export interface RenderedImage extends ImageData {
  provider: 'google' | 'openai' | 'browser'; model: string; requestedModel: string;
  warnings: string[]; requestedResolution: string;
}
export interface ProviderConfig {
  openaiApiKey?: string; googleApiKey?: string; defaults: ModelSettings;
}

export function imageSize(model: string, aspectRatio: string, resolution: string): string {
  if (model === 'dall-e-2') return '1024x1024';
  if (model === 'dall-e-3') return aspectRatio === '16:9' ? '1792x1024' : aspectRatio === '9:16' ? '1024x1792' : '1024x1024';
  if (model.startsWith('gpt-image-2')) {
    const sizes = resolution === '4K' ? ['2048x2048', '3840x2160', '2160x3840']
      : resolution === '2K' ? ['2048x2048', '2048x1152', '1152x2048'] : ['1024x1024', '1536x864', '864x1536'];
    return sizes[aspectRatio === '16:9' ? 1 : aspectRatio === '9:16' ? 2 : 0];
  }
  return aspectRatio === '16:9' ? '1536x1024' : aspectRatio === '9:16' ? '1024x1536' : '1024x1024';
}

export function identifyImage(data: Buffer): ImageData['mimeType'] {
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
  if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw new Error('Expected a valid PNG, JPEG, or WebP image.');
}

export class Providers {
  readonly openai?: OpenAI;
  readonly google?: GoogleGenAI;
  constructor(readonly config: ProviderConfig, clients: { openai?: OpenAI; google?: GoogleGenAI } = {}) {
    this.openai = clients.openai || (config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey, timeout: 240000, maxRetries: 2 }) : undefined);
    this.google = clients.google || (config.googleApiKey ? new GoogleGenAI({ apiKey: config.googleApiKey, httpOptions: { timeout: 240000 } }) : undefined);
  }

  settings(input: ModelSettings = {}) {
    const settings = { ...this.config.defaults, ...input };
    const provider = settings.provider || 'auto';
    let imageProvider: 'google' | 'openai' = provider === 'openai' ? 'openai' : provider === 'google' || provider === 'hybrid' ? 'google' : this.google ? 'google' : 'openai';
    let textProvider: 'google' | 'openai' = provider === 'openai' || provider === 'hybrid' ? 'openai' : provider === 'google' ? 'google' : this.google ? 'google' : 'openai';
    if (settings.imageModel) {
      const family = settings.imageModel.startsWith('gemini') ? 'google' : 'openai';
      if (provider !== 'auto' && family !== imageProvider) throw new Error(`Image model ${settings.imageModel} does not match provider ${provider}.`);
      imageProvider = family;
    }
    if (settings.textModel) {
      const family = settings.textModel.startsWith('gemini') ? 'google' : 'openai';
      if (provider !== 'auto' && family !== textProvider) throw new Error(`Text model ${settings.textModel} does not match provider ${provider}.`);
      textProvider = family;
    }
    return {
      ...settings, imageProvider, textProvider,
      imageModel: settings.imageModel || (imageProvider === 'google' ? 'gemini-3-pro-image' : 'gpt-image-2'),
      textModel: settings.textModel || (textProvider === 'google' ? 'gemini-3.1-pro-preview' : 'gpt-4o'),
      resolution: settings.resolution || '4K', allowFallback: settings.allowFallback ?? false,
    };
  }

  private require(provider: 'google' | 'openai') {
    if (provider === 'google' && !this.google) throw new Error('GEMINI_API_KEY is missing. Configure it in the plugin environment or choose OpenAI.');
    if (provider === 'openai' && !this.openai) throw new Error('OPENAI_API_KEY is missing. Configure it in the plugin environment or choose Google.');
  }

  assertAvailable(kind: 'image' | 'text', input: ModelSettings = {}) {
    const settings = this.settings(input);
    this.require(kind === 'image' ? settings.imageProvider : settings.textProvider);
  }

  async text(prompt: string, input: ModelSettings = {}, image?: ImageData, json = true, signal?: AbortSignal): Promise<string> {
    const settings = this.settings(input);
    this.require(settings.textProvider);
    if (settings.textProvider === 'google') {
      const response = await this.google!.models.generateContent({
        model: settings.textModel,
        contents: { parts: [{ text: prompt }, ...(image ? [{ inlineData: { mimeType: image.mimeType, data: image.data.toString('base64') } }] : [])] },
        config: { ...(json ? { responseMimeType: 'application/json' } : {}), abortSignal: signal },
      });
      if (!response.text) throw new Error('The text model returned no content.');
      return response.text;
    }
    const response = await this.openai!.chat.completions.create({
      model: settings.textModel,
      messages: [{ role: 'system', content: json ? 'Return only valid JSON matching the requested schema. Preserve source facts exactly.' : 'You are the Zenaico visual design assistant. Help with infographic design and preserve source facts.' },
        { role: 'user', content: image ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.data.toString('base64')}` } }] : prompt }],
      ...(json ? { response_format: { type: 'json_object' as const } } : {}),
    }, { signal });
    const value = response.choices[0]?.message?.content;
    if (!value) throw new Error('The text model returned no content.');
    return value;
  }

  async render(prompt: string, options: GenerationOptions, input: ModelSettings = {}, source?: ImageData, mask?: ImageData, signal?: AbortSignal): Promise<RenderedImage> {
    const settings = this.settings(input);
    this.require(settings.imageProvider);
    if (source && settings.imageModel === 'dall-e-3') throw new Error('DALL-E 3 cannot edit an image. Choose gpt-image-2 or a Gemini image model.');
    const warnings: string[] = [];
    const generate = async (model: string): Promise<ImageData> => {
      if (settings.imageProvider === 'google') {
        const response = await this.google!.models.generateContent({
          model,
          contents: { parts: [
            ...(source ? [{ inlineData: { mimeType: source.mimeType, data: source.data.toString('base64') } }] : []),
            ...(mask ? [{ inlineData: { mimeType: mask.mimeType, data: mask.data.toString('base64') } }, { text: 'The second image is an edit mask. Modify only the indicated area.' }] : []),
            { text: prompt },
          ] },
          config: { responseModalities: [Modality.TEXT, Modality.IMAGE], imageConfig: { aspectRatio: options.aspectRatio, imageSize: settings.resolution }, abortSignal: signal },
        });
        const image = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))?.inlineData;
        if (!image?.data) throw new Error('The image model returned no image. Check the prompt or model availability.');
        const data = Buffer.from(image.data, 'base64');
        return { data, mimeType: identifyImage(data) };
      }
      const maxPrompt = model === 'dall-e-2' ? 1000 : model === 'dall-e-3' ? 4000 : 32000;
      if (prompt.length > maxPrompt) throw new Error(`Prompt exceeds ${model}'s ${maxPrompt}-character limit. Shorten the concept or use gpt-image-2.`);
      const size = imageSize(model, options.aspectRatio, settings.resolution);
      const modern = !model.startsWith('dall-e');
      const common = { model, prompt, n: 1, size, ...(modern ? { quality: 'high' as const, output_format: 'png' as const } : { response_format: 'b64_json' as const }) };
      const response = source
        ? await this.openai!.images.edit({ ...common, image: await toFile(source.data, `source.${source.mimeType.split('/')[1]}`, { type: source.mimeType }),
            ...(modern ? { input_fidelity: 'high' as const } : {}),
            ...(mask ? { mask: await toFile(mask.data, 'mask.png', { type: mask.mimeType }) } : {}) }, { signal })
        : await this.openai!.images.generate({ ...common, ...(model === 'dall-e-3' ? { quality: 'hd' as const } : {}) }, { signal });
      const image = response.data?.[0];
      if (!image?.b64_json) throw new Error('The image API returned no base64 image data.');
      const data = Buffer.from(image.b64_json, 'base64');
      return { data, mimeType: identifyImage(data) };
    };
    let model = settings.imageModel;
    let image: ImageData;
    try { image = await generate(model); }
    catch (error) {
      const status = (error as { status?: number }).status;
      if (!settings.allowFallback || signal?.aborted || status === 401 || status === 403 || status === 429 || !(status === 404 || (status === 400 && /model|not supported|unsupported/i.test(String(error))))) throw error;
      const fallback = settings.imageProvider === 'google' ? 'gemini-3.1-flash-image' : source ? 'gpt-image-1.5' : 'dall-e-3';
      if (model === fallback) throw error;
      warnings.push(`Requested model ${model} was unavailable; used explicitly permitted fallback ${fallback}.`);
      model = fallback;
      image = await generate(model);
    }
    if (settings.imageProvider === 'openai' && model.startsWith('gpt-image-2') && options.aspectRatio === '1:1' && settings.resolution === '4K') warnings.push('Square GPT Image 2 output uses 2048×2048; 4K dimensions are reserved for supported landscape or portrait sizes.');
    if (settings.imageProvider === 'openai' && !model.startsWith('gpt-image-2')) warnings.push(`Output dimensions for ${model} are ${imageSize(model, options.aspectRatio, settings.resolution)}; requested resolution may not be supported.`);
    return { ...image, provider: settings.imageProvider, model, requestedModel: settings.imageModel, warnings, requestedResolution: settings.resolution };
  }
}
