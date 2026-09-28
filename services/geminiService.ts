import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import type { InfographicContent, ChatMessage, GenerationOptions, DetectedText, ApiSettings, StylePreset } from '../types';
import { DomainHarmonizer } from './domainHarmonizer';
import { STYLE_PRESETS } from '../constants';

const getApiSettings = (): ApiSettings => {
    try {
        const settings = localStorage.getItem('zen-api-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return {
                provider: parsed.provider || 'google',
                openaiApiKey: parsed.openaiApiKey || '',
                googleApiKey: parsed.googleApiKey || '',
                imageModel: parsed.imageModel || 'gemini-3-pro-image',
                textModel: parsed.textModel || 'gemini-3.1-pro-preview'
            };
        }
    } catch (error) {
        console.error("Failed to parse API settings from localStorage", error);
    }
    return {
        provider: 'google',
        openaiApiKey: '',
        googleApiKey: '',
        imageModel: 'gemini-3-pro-image',
        textModel: 'gemini-3.1-pro-preview'
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

const sanitizeText = (text: string): string => {
    if (!text) return text;
    // Only apply sports roster corrections if Georgia football is explicitly mentioned
    if (/\b(georgia|bulldogs|uga)\b/i.test(text) && /\b(quarterback|qb|carson|beck)\b/i.test(text)) {
        return text
            .replace(/Carson\s+Beck\s*#\d*/gi, 'Gunner Stockton #14')
            .replace(/Carson\s+Beck/gi, 'Gunner Stockton')
            .replace(/C\.\s*Beck/gi, 'G. Stockton');
    }
    return text;
};

const sanitizeInfographics = (items: InfographicContent[]): InfographicContent[] => {
    return (items || []).map(item => ({
        title: sanitizeText(item.title),
        points: (item.points || []).map(p => sanitizeText(p)),
        imagePrompt: sanitizeText(item.imagePrompt)
    }));
};

export const suggestDataPoints = async (topic: string): Promise<string[]> => {
    const settings = getApiSettings();
    const isSportsTopic = /\b(football|quarterback|nfl|ncaa|georgia|game|touchdown)\b/i.test(topic);
    const sportsAccuracyClause = isSportsTopic 
        ? " Accuracy mandate: Grounded in active 2026 sports rosters (e.g. for Georgia Bulldogs, starting QB is Gunner Stockton #14)." 
        : "";
    const prompt = `Find 3 to 5 high-impact, specific numerical data points, architectural specifications, or key statistics for the topic "${topic}". Output as JSON object with key "suggestedData" containing an array of strings.${sportsAccuracyClause} Ensure metrics are authentic, specific, and impactful for data visualization.`;

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
                if (data.suggestedData) return data.suggestedData.map(sanitizeText);
                if (data.infographics) {
                    return data.infographics.map((i: any) => sanitizeText(i.points?.[0] || i.title)).slice(0, 3);
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
    return (result.suggestedData || []).map(sanitizeText);
};

export const generateInfographicConcepts = async (topic: string, options: GenerationOptions): Promise<InfographicContent[]> => {
    const settings = getApiSettings();
    const validData = options.dataEntries.filter(e => e.trim() !== '');

    const effectivePreset = options.stylePreset || 
        STYLE_PRESETS.find(s => s.name === options.stylePresetName || s.promptSuffix === options.stylePromptSuffix) || 
        STYLE_PRESETS[0];

    const harmony = DomainHarmonizer.harmonize({
        topic,
        stylePreset: effectivePreset,
        options
    });

    // Check if topic is a rich multi-section article or stack
    const articleStructure = DomainHarmonizer.extractArticleStructure(topic);
    const hasStructuredLayers = articleStructure.sections.length > 0;

    const crossDomainGuidance = harmony.isIntertwined 
        ? `\nCROSS-DOMAIN STYLE HARMONY ACTIVATED: ${harmony.fusionHeadline}
${harmony.fusionDescription}
${harmony.antiMorphingDirectives}
Ensure the 4 infographic concepts creatively translate the visual archetype (${harmony.styleArchetype}) onto the authentic domain (${harmony.contentDomain}) without morphing or chimeric artifacts.
Recommended concept structures: ${harmony.suggestedConceptTitles.join(', ')}.\n` 
        : '';
    
    let prompt: string;
    if (hasStructuredLayers) {
        prompt = `
      TASK: Create 4 completely different publication-ready infographic concepts for the article/stack: "${articleStructure.coreTitle}".
      
      CORE ARTICLE THESIS:
      ${articleStructure.thesis}
      
      EXTRACTED STRUCTURED TIERS / LAYERS (${articleStructure.sections.length} Tiers):
      ${articleStructure.sections.map(s => `* Layer ${s.number}: ${s.heading} -> Key principle: ${s.summary}${s.metrics.length > 0 ? ` (Metrics: ${s.metrics.join(', ')})` : ''}`).join('\n')}
      
      REAL METRICS TO HIGHLIGHT:
      ${[...validData, ...articleStructure.keyMetrics].filter(Boolean).join(', ')}
      
      VISUAL STYLE: ${effectivePreset.name} (${effectivePreset.promptSuffix})
      TARGET AUDIENCE: ${options.targetAudience}
      TONE: ${options.tone}
      COMPLEXITY: ${options.visualComplexity || 'ultra-detailed'}
      ${crossDomainGuidance}

      MANDATORY 4 CONCEPT BLUEPRINTS TO GENERATE:
      1. Concept 1 (Complete Stack Hierarchy): Visualizes all ${articleStructure.sections.length} layers in an interconnected vertical architecture diagram with status indicators, boundary gates, and execution layers.
      2. Concept 2 (Bounded Autonomy & Governance Matrix): Deep-dive comparison matrix contrasting unrestricted machine autonomy with bounded autonomy, emphasizing transaction thresholds, spending mandates ($50 / $500 / $5,000), and permission surfaces.
      3. Concept 3 (Accountability & Recourse Telemetry): Focuses on the institutional bridge (Machine Identity, Audit Trails, Monitoring Circuits, Insurance Liability, and Human Recourse).
      4. Concept 4 (${harmony.styleArchetype === 'sports_broadcast' ? 'ESPN Sports Analyst / Tale of the Tape Breakdown' : 'Analytical Telemetry Breakdown'}): An elite analytical overview translating the layers into high-contrast telemetry ribbons, Tale of the Tape comparisons, and executive scoring matrices (Strictly NO athletic balls or turf artifacts).

      CRITICAL CONTENT FIDELITY INSTRUCTIONS:
      - Strictly ground every concept in the actual article content. NEVER hallucinate generic corporate filler or unrelated KPIs (e.g. do NOT invent "Program Completion Rate").
      - Each "imagePrompt" MUST explicitly mandate rendering the real layer titles ("1. TRAINING", "2. IDENTITY", ... "10. RECOURSE") and specific numerical limits ($50, $500, $5,000, 900,000 transactions).
      - Use ONLY concise bullet points and large readable data labels.
      ${options.excludeElements ? `EXCLUDED ELEMENTS: ${options.excludeElements}` : ''}
        `.trim();
    } else {
        const isSportsTopic = /\b(football|quarterback|nfl|ncaa|georgia|game|touchdown)\b/i.test(topic);
        const sportsAccuracyClause = isSportsTopic 
            ? "ACCURACY MANDATE: Grounded in 2026 sports rosters (e.g. for Georgia Bulldogs, starting QB is Gunner Stockton #14)." 
            : "";
        prompt = `
      TASK: Create 4 completely different infographic concepts for "${topic}".
      MANDATORY DATA TO INCLUDE: ${validData.join(', ')}
      Target: ${options.targetAudience}
      Tone: ${options.tone}
      Complexity: ${options.visualComplexity || 'ultra-detailed'}
      ${crossDomainGuidance}

      The infographics MUST visually represent the provided data points using highly creative charts, callouts, and thematic objects.
      Each concept should have a unique layout (${options.layout}).
      CRITICAL: Ensure the visual concepts are ABSOLUTE MASTERPIECES packed with incredible, one-of-a-kind thematic objects, mind-blowing graphics, and highly creative ways of integrating the stats and facts directly into the visual elements. The design MUST be dense with meaningful, breathtaking details.
      TEXT CONSTRAINT: Keep all text extremely brief. Use ONLY short bullet points, large numbers, and concise labels. DO NOT use paragraphs or long sentences.
      ${sportsAccuracyClause}
      ${options.excludeElements ? `EXCLUDED ELEMENTS: ${options.excludeElements}` : ''}
        `.trim();
    }

    const useOpenAI = settings.provider === 'openai' && (settings.openaiApiKey || process.env.OPENAI_API_KEY);

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
                    return sanitizeInfographics(data.infographics);
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
    return sanitizeInfographics(result.infographics || []);
};

export const generateInfographicImage = async (prompt: string, stylePrompt: string, options: GenerationOptions): Promise<string[]> => {
    const settings = getApiSettings();
    const modelToUse = settings.imageModel || 'gemini-3-pro-image';
    const isOpenAIModel = modelToUse.startsWith('gpt-image') || modelToUse.startsWith('dall-e');
    const useOpenAI = settings.provider === 'openai' && (isOpenAIModel || settings.openaiApiKey || process.env.OPENAI_API_KEY);

    const validData = options.dataEntries.filter(e => e.trim() !== '');
    const dataPrompt = validData.length > 0 ? `CRITICAL TEXT TO RENDER EXACTLY:\n${validData.map(d => `* "${d}"`).join('\n')}` : '';
    
    const complexityMod = options.visualComplexity === 'ultra-detailed' 
        ? "Ultra-technical schematic style, microscopic physical textures, ray-traced lighting, dense data visualizations, complex HUD elements."
        : "Clean, standard professional layout, high readability, balanced white space.";

    // Cross-Domain Harmonization & Anti-Morphing Guard
    const effectivePreset = options.stylePreset || 
        STYLE_PRESETS.find(s => s.promptSuffix === stylePrompt || s.name === options.stylePresetName) || 
        { id: 'custom', name: options.stylePresetName || 'Active Style', promptSuffix: stylePrompt, category: 'Custom' };

    const harmony = DomainHarmonizer.harmonize({
        topic: prompt,
        stylePreset: effectivePreset,
        options
    });

    const finalStylePrompt = harmony.isIntertwined ? harmony.harmonizedStylePrompt : stylePrompt;
    const finalPositive = harmony.isIntertwined 
        ? `${harmony.adaptedPositivePrompt}, ${options.positivePrompt || ''}` 
        : (options.positivePrompt || 'absolute masterpiece, one-of-a-kind, incredible objects, breathtaking textures, 8k, sharp focus, highly detailed, dense visual information, creative data visualization, beautiful typography');
    const finalNegative = harmony.isIntertwined 
        ? `${harmony.strictNegativePrompt}, ${options.negativePrompt || ''}` 
        : (options.negativePrompt || 'blurry, low quality, artifacts, boring, plain, sparse, unreadable text, generic');

    const finalPrompt = `
      ${prompt}
      
      ${dataPrompt}
      
      STRICT REQUIREMENT: Visually render exact numbers and key labels directly into the image. Bold typography, creative charts, seamless visual integration.
      TEXT CONSTRAINT: Minimal text. Use ONLY large, bold, readable labels, short bullet points, and big data numbers. No dense paragraphs.
      VISUAL STYLE: ${finalStylePrompt}
      COMPLEXITY: ${complexityMod}
      ENHANCEMENT: Masterpiece infographic visual, state-of-the-art lab quality, award-winning graphic design, 8k resolution, razor-sharp focus, photorealistic textures.
      ${finalPositive}
      NEGATIVE: ${finalNegative}
    `.trim();

    if (useOpenAI) {
        try {
            const resp = await fetch('/api/openai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    model: isOpenAIModel ? modelToUse : 'dall-e-3',
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
                model: 'gemini-3-pro-image',
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
        console.warn("gemini-3-pro-image 4K failed, trying gemini-3.1-flash-image fallback...", e);
        const flashResponse = await retryWithBackoff(async () => {
            const ai = getGoogleAI();
            return await ai.models.generateContent({
                model: 'gemini-3.1-flash-image',
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
            model: 'gemini-3-pro-image',
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
                return { text: data.text || "I am your Infographic Studio Assistant." };
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
    const effectivePreset = options.stylePreset || 
        STYLE_PRESETS.find(s => s.name === options.stylePresetName || s.promptSuffix === options.stylePromptSuffix) || 
        STYLE_PRESETS[0];

    const harmony = DomainHarmonizer.harmonize({
        topic: text.slice(0, 150),
        textContent: text,
        stylePreset: effectivePreset,
        options
    });

    const articleContext = harmony.isIntertwined && harmony.styleArchetype === 'sports_broadcast'
        ? `ARTICLE TEXT FOR COMPREHENSIVE OVERVIEW:\n${text}\n\nSPECIAL DIRECTIVE: Intertwine this ${harmony.contentDomain} article into an elite ESPN Primetime / Sports Analyst broadcast overview. Extract head-to-head architectural comparisons, benchmark telemetry, and hard numbers, framing them with Tale of the Tape and Scorebug concepts without morphing athletes or sports balls onto technology.`
        : `ARTICLE TEXT:\n${text}`;

    return await generateInfographicConcepts(articleContext, options);
};
