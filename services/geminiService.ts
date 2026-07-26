import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import type { InfographicContent, ChatMessage, GenerationOptions, DetectedText, ApiSettings } from '../types';

const getApiSettings = (): ApiSettings => {
    try {
        const settings = localStorage.getItem('zen-api-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return {
                provider: parsed.provider || 'openai',
                openaiApiKey: parsed.openaiApiKey || '',
                googleApiKey: parsed.googleApiKey || '',
                imageModel: parsed.imageModel || 'gpt-image-2',
                textModel: parsed.textModel || 'gpt-4o'
            };
        }
    } catch (error) {
        console.error("Failed to parse API settings from localStorage", error);
    }
    return {
        provider: 'openai',
        openaiApiKey: '',
        googleApiKey: '',
        imageModel: 'gpt-image-2',
        textModel: 'gpt-4o'
    };
};

const getGoogleAI = () => {
    const settings = getApiSettings();
    const apiKey = settings.googleApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please configure it in settings or provide an OpenAI API Key.");
    }
    return new GoogleGenAI({ apiKey });
};

const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = 3,
    initialDelay: number = 1000
): Promise<T> => {
    let lastError: any;
    for (let i = 0; i <= retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const errorMessage = error?.message || JSON.stringify(error);
            const isRateLimit = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
            const isPermissionError = errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED');
            
            if (isPermissionError) {
                console.error("Permission Denied: Ensure you are using a valid API key.");
                throw new Error("Access Denied: Please check your API key settings.");
            }
            
            if (!isRateLimit || i === retries) throw error;
            
            const delay = initialDelay * Math.pow(2, i);
            console.warn(`Rate limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};

const articleAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        infographics: {
            type: Type.ARRAY,
            description: "An array of 4 distinct infographic concept plans.",
            minItems: 4,
            maxItems: 4,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING }
                },
                required: ['title', 'points', 'imagePrompt']
            }
        }
    },
    required: ['infographics']
};

export const suggestDataPoints = async (topic: string): Promise<string[]> => {
    const settings = getApiSettings();
    const prompt = `Find 3 high-impact, specific numerical data points or statistics for the topic "${topic}". Output as JSON object with key "suggestedData" containing an array of strings.`;

    const useOpenAI = settings.provider === 'openai' || (settings.provider === 'hybrid' && (settings.openaiApiKey || process.env.OPENAI_API_KEY));

    if (useOpenAI) {
        try {
            const resp = await fetch('/api/openai/generate-concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Task: ${prompt}`,
                    apiKey: settings.openaiApiKey,
                    model: settings.textModel || 'gpt-4o-mini'
                })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.suggestedData) return data.suggestedData;
                if (data.infographics) {
                    return data.infographics.map((i: any) => i.points?.[0] || i.title).slice(0, 3);
                }
            }
        } catch (err) {
            console.warn("OpenAI suggestDataPoints failed, trying Gemini...", err);
        }
    }

    const response = await retryWithBackoff<GenerateContentResponse>(async () => {
        const ai = getGoogleAI();
        return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { suggestedData: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ['suggestedData']
                } 
            },
        });
    });
    const result = JSON.parse(response.text?.trim() || "{}");
    return result.suggestedData || [];
};

export const generateInfographicConcepts = async (topic: string, options: GenerationOptions): Promise<InfographicContent[]> => {
    const settings = getApiSettings();
    const validData = options.dataEntries.filter(e => e.trim() !== '');
    
    const prompt = `
      TASK: Create 4 completely different infographic concepts for "${topic}".
      MANDATORY DATA TO INCLUDE: ${validData.join(', ')}
      Target: ${options.targetAudience}
      Tone: ${options.tone}
      Complexity: ${options.visualComplexity || 'ultra-detailed'}

      The infographics MUST visually represent the provided data points using highly creative charts, callouts, and thematic objects.
      Each concept should have a unique layout (${options.layout}).
      CRITICAL: Ensure the visual concepts are ABSOLUTE MASTERPIECES packed with incredible, one-of-a-kind thematic objects, mind-blowing graphics, and highly creative ways of integrating the stats and facts directly into the visual elements. The design MUST be dense with meaningful, breathtaking details.
      TEXT CONSTRAINT: Keep all text extremely brief. Use ONLY short bullet points, large numbers, and concise labels. DO NOT use paragraphs or long sentences.
    `;

    const useOpenAI = settings.provider === 'openai' || (settings.provider === 'hybrid' && (settings.openaiApiKey || process.env.OPENAI_API_KEY));

    if (useOpenAI) {
        try {
            const resp = await fetch('/api/openai/generate-concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    apiKey: settings.openaiApiKey,
                    model: settings.textModel || 'gpt-4o'
                })
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data.infographics && Array.isArray(data.infographics) && data.infographics.length > 0) {
                    return data.infographics;
                }
            }
        } catch (err) {
            console.warn("OpenAI concepts generation failed, falling back to Gemini...", err);
        }
    }

    const response = await retryWithBackoff<GenerateContentResponse>(async () => {
        const ai = getGoogleAI();
        return await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: prompt,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: articleAnalysisSchema
            },
        });
    });
    const result = JSON.parse(response.text?.trim() || "{}");
    return result.infographics || [];
};

export const generateInfographicImage = async (prompt: string, stylePrompt: string, options: GenerationOptions): Promise<string[]> => {
    const settings = getApiSettings();
    const modelToUse = settings.imageModel || 'gpt-image-2';
    const isOpenAIModel = modelToUse.startsWith('gpt-image') || modelToUse.startsWith('dall-e');
    const useOpenAI = settings.provider === 'openai' || (settings.provider === 'hybrid' && (isOpenAIModel || settings.openaiApiKey || process.env.OPENAI_API_KEY)) || isOpenAIModel;

    const validData = options.dataEntries.filter(e => e.trim() !== '');
    const dataPrompt = validData.length > 0 ? `CRITICAL TEXT TO RENDER EXACTLY:\n${validData.map(d => `* "${d}"`).join('\n')}` : '';
    
    const complexityMod = options.visualComplexity === 'ultra-detailed' 
        ? "Ultra-technical schematic style, microscopic detail, dense data visualizations, complex HUD elements."
        : "Clean, standard professional layout, high readability, balanced white space.";

    const finalPrompt = `
      ${prompt}
      
      ${dataPrompt}
      
      STRICT REQUIREMENT: Visually render exact numbers and key labels directly into the image. Bold typography, creative charts, seamless visual integration.
      TEXT CONSTRAINT: Minimal text. Use ONLY large, bold, readable labels, short bullet points, and big data numbers. No dense paragraphs.
      VISUAL STYLE: ${stylePrompt}
      COMPLEXITY: ${complexityMod}
      ENHANCEMENT: Masterpiece infographic graphic, incredible details, breathtaking themes, award-winning design, 8k resolution, crisp vector style and sharp focus.
      ${options.positivePrompt || 'absolute masterpiece, one-of-a-kind, incredible objects, breathtaking themes, 8k, sharp focus, highly detailed, dense visual information, creative data visualization, beautiful typography'}
      NEGATIVE: ${options.negativePrompt || 'blurry, low quality, artifacts, boring, plain, sparse, unreadable text, generic'}
    `;

    if (useOpenAI) {
        try {
            const resp = await fetch('/api/openai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    model: isOpenAIModel ? modelToUse : 'gpt-image-2',
                    apiKey: settings.openaiApiKey,
                    aspectRatio: options.aspectRatio
                })
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data.imageUrl) {
                    return [data.imageUrl];
                }
            } else {
                const errData = await resp.json().catch(() => ({}));
                console.warn("OpenAI image error, checking fallback:", errData);
                throw new Error(errData.error || "OpenAI image generation failed");
            }
        } catch (e: any) {
            console.error("OpenAI image generation failed:", e);
            const hasGeminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || settings.googleApiKey;
            if (!hasGeminiKey) {
                throw new Error(e.message || "OpenAI image generation failed. Please verify your OpenAI API key in Studio Settings.");
            }
            console.warn("Falling back to Google Gemini image model...");
        }
    }

    const imageUrls: string[] = [];
    try {
        const response = await retryWithBackoff(async () => {
            const ai = getGoogleAI();
            return await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [{ text: finalPrompt }] },
                config: { 
                    responseModalities: [Modality.IMAGE], 
                    imageConfig: { aspectRatio: options.aspectRatio, imageSize: '4K' } 
                },
            });
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) imageUrls.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
    } catch (e: any) {
        const flashResponse = await retryWithBackoff(async () => {
            const ai = getGoogleAI();
            return await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: finalPrompt }] },
                config: { 
                    responseModalities: [Modality.IMAGE], 
                    imageConfig: { aspectRatio: options.aspectRatio } 
                },
            });
        });
        const part = flashResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) imageUrls.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
    }
    return imageUrls;
};

export const refineInfographicImage = async (baseImage: string, editPrompt: string, maskImage?: string): Promise<string> => {
    const settings = getApiSettings();
    const modelToUse = settings.imageModel || 'gpt-image-2';
    const isOpenAIModel = modelToUse.startsWith('gpt-image') || modelToUse.startsWith('dall-e');
    const useOpenAI = settings.provider === 'openai' || (settings.provider === 'hybrid' && (isOpenAIModel || settings.openaiApiKey || process.env.OPENAI_API_KEY)) || isOpenAIModel;

    if (useOpenAI) {
        try {
            const resp = await fetch('/api/openai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Refine and improve this infographic: ${editPrompt}. Keep same master quality, ultra-sharp detail, high resolution.`,
                    model: isOpenAIModel ? modelToUse : 'gpt-image-2',
                    apiKey: settings.openaiApiKey,
                    aspectRatio: '1:1'
                })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.imageUrl) return data.imageUrl;
            }
        } catch (e) {
            console.warn("OpenAI refine failed, falling back to Gemini...", e);
        }
    }

    try {
        const ai = getGoogleAI();
        const parts: any[] = [{ inlineData: { mimeType: 'image/jpeg', data: baseImage.split(',')[1] } }];
        if (maskImage) parts.push({ inlineData: { mimeType: 'image/png', data: maskImage.split(',')[1] } });
        parts.push({ text: `EDIT TASK: ${editPrompt}. Maintain 4K quality and consistent style.` });

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : baseImage;
    } catch (e) {
        return baseImage;
    }
};

export const analyzeImageForFlaws = async (imageBase64: string, content: any): Promise<string[]> => {
    try {
        const settings = getApiSettings();
        const useOpenAI = settings.provider === 'openai' || (settings.provider === 'hybrid' && (settings.openaiApiKey || process.env.OPENAI_API_KEY));

        if (useOpenAI) {
            try {
                const resp = await fetch('/api/openai/generate-concepts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: `Inspect this image concept for flaws or spelling issues. Return JSON with key "suggestions" containing an array of short strings.`,
                        apiKey: settings.openaiApiKey,
                        model: 'gpt-4o-mini'
                    })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.suggestions) return data.suggestions;
                }
            } catch (err) {
                console.warn(err);
            }
        }

        const ai = getGoogleAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: 'Identify visual flaws or spelling errors. Output as JSON suggestions array.' }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }] },
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ['suggestions']
                }
            }
        });
        const result = JSON.parse(response.text.trim());
        return result.suggestions || [];
    } catch (e) {
        return [];
    }
};

export const detectTextInImage = async (imageBase64: string): Promise<DetectedText[]> => {
    try {
        const ai = getGoogleAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: 'OCR analysis: return every text block found with normalized bounding boxes (0-1). JSON format.' }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }] },
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        detectedTexts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    text: { type: Type.STRING },
                                    boundingBox: {
                                        type: Type.OBJECT,
                                        properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, width: { type: Type.NUMBER }, height: { type: Type.NUMBER } },
                                        required: ['x', 'y', 'width', 'height']
                                    }
                                },
                                required: ['id', 'text', 'boundingBox']
                            }
                        }
                    },
                    required: ['detectedTexts']
                }
            }
        });
        const result = JSON.parse(response.text.trim());
        return result.detectedTexts || [];
    } catch (e) {
        return [];
    }
};

export const enhanceInfographicImage = async (baseImage: string): Promise<string> => {
    return await refineInfographicImage(baseImage, "Heal artifacts, upscale detail and enhance color depth to 4K publication quality.");
};

export const enhanceScreenshot = async (screenshotBase64: string, options: GenerationOptions, index: number, total: number): Promise<string> => {
    const settings = getApiSettings();
    const modelToUse = settings.imageModel || 'gpt-image-2';
    const isOpenAIModel = modelToUse.startsWith('gpt-image') || modelToUse.startsWith('dall-e');
    const useOpenAI = settings.provider === 'openai' || (settings.provider === 'hybrid' && (isOpenAIModel || settings.openaiApiKey || process.env.OPENAI_API_KEY)) || isOpenAIModel;

    const stylePrompt = options.positivePrompt || 'masterpiece, 8k, sharp focus, highly detailed, beautiful typography, award-winning design, billion-dollar aesthetic';
    
    const prompt = `
      Transform this app screenshot into a stunning, publish-ready Fortune 500 marketing campaign asset.
      Image ${index + 1} of ${total} in sequence.
      Maintain core UI layout, but frame it in a high-end promotional style with cinematic lighting and typography.
      Style: ${stylePrompt}
    `;

    if (useOpenAI) {
        try {
            const resp = await fetch('/api/openai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model: isOpenAIModel ? modelToUse : 'gpt-image-2',
                    apiKey: settings.openaiApiKey,
                    aspectRatio: options.aspectRatio
                })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.imageUrl) return data.imageUrl;
            }
        } catch (e) {
            console.warn("OpenAI enhance screenshot failed, fallback to Gemini", e);
        }
    }

    try {
        const ai = getGoogleAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { 
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: screenshotBase64.split(',')[1] } }, 
                    { text: prompt }
                ] 
            },
            config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: options.aspectRatio, imageSize: '4K' } },
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : screenshotBase64;
    } catch (e: any) {
        return screenshotBase64;
    }
};

export const sendMessage = async (history: ChatMessage[]) => {
    const settings = getApiSettings();
    const useOpenAI = settings.provider === 'openai' || (settings.provider === 'hybrid' && (settings.openaiApiKey || process.env.OPENAI_API_KEY));

    if (useOpenAI) {
        try {
            const resp = await fetch('/api/openai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history,
                    apiKey: settings.openaiApiKey,
                    model: settings.textModel || 'gpt-4o-mini'
                })
            });
            if (resp.ok) {
                const data = await resp.json();
                return { text: data.text || "I am your OpenAI-powered ZEN Assistant." };
            }
        } catch (err) {
            console.warn("OpenAI chat failed, falling back to Gemini...", err);
        }
    }

    const ai = getGoogleAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
    });
    return { text: response.text || "" };
};

export const generateInfographicContentFromUrl = async (url: string, options: GenerationOptions) => {
    return await generateInfographicConcepts(`Article URL: ${url}`, options);
};

export const generateInfographicsFromFile = async (file: File, options: GenerationOptions) => {
    return await generateInfographicConcepts(`Uploaded file: ${file.name}`, options);
};

export const generateInfographicsFromArticle = async (text: string, options: GenerationOptions) => {
    return await generateInfographicConcepts(text, options);
};
