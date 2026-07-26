
export type ApiProvider = 'openai' | 'google' | 'hybrid';

export type ImageModelOption = 
  | 'gpt-image-2'
  | 'dall-e-3'
  | 'dall-e-2'
  | 'gemini-3-pro-image-preview'
  | 'gemini-2.5-flash-image';

export type TextModelOption =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'o3-mini'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3-flash-preview';

export interface StylePreset {
  id: string;
  name: string;
  promptSuffix: string;
  category: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface InfographicContent {
  title: string;
  points: string[];
  imagePrompt: string;
}

export interface BoundingBox {
  x: number; // top-left x, as a percentage of image width
  y: number; // top-left y, as a percentage of image height
  width: number; // as a percentage of image width
  height: number; // as a percentage of image height
}

export interface DetectedText {
  id: string;
  text: string;
  boundingBox: BoundingBox;
}

export interface GeneratedImage {
  id: number;
  url: string;
  isAnalyzing: boolean;
  isRefining?: boolean;
  flawSuggestions: string[];
  isDetectingText: boolean;
  detectedText: DetectedText[];
}

export interface ApiSettings {
  provider: ApiProvider;
  openaiApiKey?: string;
  googleApiKey?: string;
  imageModel: ImageModelOption;
  textModel?: TextModelOption;
}

export interface GenerationOptions {
  targetAudience: 'general' | 'students' | 'experts' | 'children';
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational';
  keyElements: string;
  excludeElements: string;
  colorPalette: string;
  layout: 'centered' | 'asymmetrical' | 'minimalist' | 'data-heavy';
  numPoints: number;
  aspectRatio: '1:1' | '16:9' | '9:16';
  language: string;
  includeDataVis: boolean;
  dataEntries: string[];
  
  // Advanced State-of-the-Art Controls
  positivePrompt?: string;
  negativePrompt?: string;
  typographyStyle?: 'modern-sans' | 'classic-serif' | 'futuristic-tech' | 'handwritten-organic' | 'bold-display';
  visualComplexity?: 'minimal' | 'balanced' | 'dense' | 'ultra-detailed';
  narrativePath?: 'linear' | 'radial' | 'modular' | 'flow';

  // Upscaled Controls
  lighting?: 'studio' | 'cinematic' | 'natural' | 'neon-cyberpunk' | 'golden-hour';
  renderEngine?: 'unreal-engine-5' | 'octane-render' | 'v-ray' | 'digital-painting' | 'vector-art';
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
