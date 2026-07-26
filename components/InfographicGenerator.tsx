
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { STYLE_PRESETS } from '../constants';
import * as aiService from '../services/geminiService';
import type { InfographicContent, StylePreset, GeneratedImage, GenerationOptions } from '../types';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { ImageWithActions } from './ImageWithActions';
import { cn } from '../lib/utils';

const ImageModal: React.FC<{ src: string | null; onClose: () => void }> = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4 backdrop-blur-md" 
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-full max-h-full"
                onClick={e => e.stopPropagation()}
            >
                <img src={src} alt="Full view" className="rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-full max-h-[90vh] object-contain border border-white/10" />
                <button 
                    onClick={onClose} 
                    className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-xl text-white rounded-full p-3 hover:bg-white/20 transition shadow-2xl hover:scale-110 active:scale-95 border border-white/10"
                >
                    <Icon name="close" className="h-6 w-6" />
                </button>
            </motion.div>
        </motion.div>
    );
};

const OptionButton: React.FC<{ label: string, value: any, selectedValue: any, onClick: (value: any) => void, icon?: string }> = ({ label, value, selectedValue, onClick, icon }) => (
    <button
        onClick={() => onClick(value)}
        className={cn(
            "px-6 py-3 rounded-2xl transition-all text-sm font-black flex items-center gap-2 border uppercase tracking-wider",
            selectedValue === value 
                ? "bg-blue-600 border-blue-500 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]" 
                : "bg-slate-900/40 border-white/5 hover:bg-slate-800/60 text-slate-400"
        )}
    >
        {icon && <Icon name={icon} className="h-4 w-4" />}
        {label}
    </button>
);

interface InfographicGeneratorProps {
    onOpenSettings?: () => void;
}

export const InfographicGenerator: React.FC<InfographicGeneratorProps> = ({ onOpenSettings }) => {
    const [inputMode, setInputMode] = useState<'topic' | 'url' | 'article' | 'file' | 'app-screenshot'>('topic');
    const [sourceInput, setSourceInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [screenshotCount, setScreenshotCount] = useState(4);
    const [isAutofilling, setIsAutofilling] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedStyles, setSelectedStyles] = useState<StylePreset[]>([STYLE_PRESETS[0]]);
    const [isLoading, setIsLoading] = useState(false);
    const [contents, setContents] = useState<InfographicContent[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[][]>([]);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    
    // Preset Filters
    const [styleCategory, setStyleCategory] = useState<string>('All');
    
    const [advancedOptions, setAdvancedOptions] = useState<GenerationOptions>({
        targetAudience: 'general',
        tone: 'professional',
        keyElements: '',
        excludeElements: '',
        colorPalette: '',
        layout: 'asymmetrical',
        numPoints: 6,
        aspectRatio: '1:1',
        language: 'English',
        includeDataVis: true,
        dataEntries: [''],
        
        // Advanced Controls
        positivePrompt: 'masterpiece, best quality, ultra-detailed, 8k, sharp focus, nikon z9, professional lighting, award winning',
        negativePrompt: 'blurry, ugly, bad quality, distorted, deformed, misspelled, text artifacts, low resolution, pixelated, amateur',
        visualComplexity: 'ultra-detailed',
        narrativePath: 'flow',
        typographyStyle: 'bold-display',
        lighting: 'cinematic',
        renderEngine: 'unreal-engine-5',
    });

    const categories = useMemo(() => {
        const cats = Array.from(new Set(STYLE_PRESETS.map(s => s.category)));
        return ['All', ...cats];
    }, []);

    const filteredPresets = useMemo(() => {
        if (styleCategory === 'All') return STYLE_PRESETS;
        return STYLE_PRESETS.filter(s => s.category === styleCategory);
    }, [styleCategory]);

    const handleConnectKey = async () => {
        if (onOpenSettings) {
            onOpenSettings();
        } else if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
        }
    };

    const updateOption = (key: keyof GenerationOptions, value: any) => {
        setAdvancedOptions(prev => ({ ...prev, [key]: value }));
    };

    const handleMagicAutofill = async () => {
        const context = sourceInput.trim() || (selectedFile?.name);
        if (!context) {
            toast.error("Please enter a topic first to use Magic Autofill.");
            return;
        }
        setIsAutofilling(true);
        try {
            const suggested = await aiService.suggestDataPoints(context);
            setAdvancedOptions(prev => ({
                ...prev,
                dataEntries: suggested,
                includeDataVis: true
            }));
            toast.success("Data points synthesized successfully!");
        } catch (err: any) {
            console.error("Autofill error:", err);
            toast.error(err.message || "Magic Autofill failed. Ensure topic is descriptive.");
        } finally {
            setIsAutofilling(false);
        }
    };

    const handleRegenerate = async (variantIndex: number) => {
        const plan = contents[variantIndex];
        if (!plan) return;

        toast.loading("Regenerating variant...", { id: `regen-${variantIndex}` });

        setGeneratedImages(prev => {
            const next = [...prev];
            next[variantIndex] = [{ id: Date.now(), url: '', isAnalyzing: false, flawSuggestions: [], isDetectingText: false, detectedText: [] }];
            return next;
        });

        const stylePrompt = selectedStyles.map(s => s.promptSuffix).join(' ');
        try {
            const urls = await aiService.generateInfographicImage(plan.imagePrompt, stylePrompt, advancedOptions);
            const imagesForPlan: GeneratedImage[] = urls.map((url, j) => ({
                id: j, url, isAnalyzing: true, flawSuggestions: [], isDetectingText: true, detectedText: [],
            }));

            setGeneratedImages(prev => {
                const next = [...prev];
                next[variantIndex] = imagesForPlan;
                return next;
            });

            toast.success("Variant regenerated!", { id: `regen-${variantIndex}` });

            // Re-run analysis
            imagesForPlan.forEach(img => {
                aiService.analyzeImageForFlaws(img.url, plan)
                    .then(s => {
                        setGeneratedImages(prev => {
                            const next = [...prev];
                            if (next[variantIndex]) next[variantIndex] = next[variantIndex].map(x => x.id === img.id ? { ...x, flawSuggestions: s, isAnalyzing: false } : x);
                            return next;
                        });
                    })
                    .catch(e => console.warn(e));

                aiService.detectTextInImage(img.url)
                    .then(t => {
                        setGeneratedImages(prev => {
                            const next = [...prev];
                            if (next[variantIndex]) next[variantIndex] = next[variantIndex].map(x => x.id === img.id ? { ...x, detectedText: t, isDetectingText: false } : x);
                            return next;
                        });
                    })
                    .catch(e => console.warn(e));
            });

        } catch (e: any) {
            console.error("Regeneration failed", e);
            toast.error(`Regeneration failed: ${e.message}`, { id: `regen-${variantIndex}` });
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setContents([]);
        setGeneratedImages([]);
        
        const mainToast = toast.loading(inputMode === 'app-screenshot' ? "Capturing platform screenshots..." : "Synthesizing infographic concepts...");

        try {
            let conceptPlans: InfographicContent[] = [];
            const options = { ...advancedOptions };

            if (inputMode === 'app-screenshot') {
                // 1. Capture screenshots
                const response = await fetch('/api/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: sourceInput, count: screenshotCount })
                });
                
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || "Failed to capture screenshots");
                }
                
                const { screenshots } = await response.json();
                
                // 2. Create concept plans for each screenshot
                conceptPlans = screenshots.map((_: any, i: number) => ({
                    title: `Platform View 0${i + 1}`,
                    points: ["Cinematic Marketing Asset", "Fortune 500 Aesthetic", "High-Fidelity Interface"],
                    imagePrompt: "App screenshot"
                }));
                
                setContents(conceptPlans);
                setGeneratedImages(conceptPlans.map(() => []));
                toast.success("Screenshots captured. Applying cinematic enhancements...", { id: mainToast });

                // 3. Enhance each screenshot
                for (let i = 0; i < screenshots.length; i++) {
                    try {
                        const enhancedUrl = await aiService.enhanceScreenshot(screenshots[i], options, i, screenshots.length);
                        const imagesForPlan: GeneratedImage[] = [{
                            id: Date.now() + i, url: enhancedUrl, isAnalyzing: false, flawSuggestions: [], isDetectingText: false, detectedText: []
                        }];
                        
                        setGeneratedImages(prev => {
                            const next = [...prev];
                            next[i] = imagesForPlan;
                            return next;
                        });
                    } catch (err) {
                        console.error(`Enhancement failed for screenshot ${i}:`, err);
                    }
                }
                setIsLoading(false);
                return;
            }

            if (inputMode === 'file' && selectedFile) {
                conceptPlans = await aiService.generateInfographicsFromFile(selectedFile, options);
            } else if (inputMode === 'article') {
                conceptPlans = await aiService.generateInfographicsFromArticle(sourceInput, options);
            } else if (inputMode === 'url') {
                const results = await aiService.generateInfographicContentFromUrl(sourceInput, options);
                conceptPlans = Array.isArray(results) ? results : [results];
            } else {
                conceptPlans = await aiService.generateInfographicConcepts(sourceInput, options);
            }
            
            setContents(conceptPlans);
            setGeneratedImages(conceptPlans.map(() => []));
            toast.success("Concepts generated. Now rendering visuals...", { id: mainToast });

            const stylePrompt = selectedStyles.map(s => s.promptSuffix).join(' ');

            // Process each variant
            for (let i = 0; i < conceptPlans.length; i++) {
                const plan = conceptPlans[i];
                try {
                    const urls = await aiService.generateInfographicImage(plan.imagePrompt, stylePrompt, options);
                    const imagesForPlan: GeneratedImage[] = urls.map((url, j) => ({
                        id: j, url, isAnalyzing: true, flawSuggestions: [], isDetectingText: true, detectedText: [],
                    }));

                    setGeneratedImages(prev => {
                        const next = [...prev];
                        next[i] = imagesForPlan;
                        return next;
                    });

                    // Trigger non-blocking enrichment
                    imagesForPlan.forEach(img => {
                        aiService.analyzeImageForFlaws(img.url, plan)
                            .then(s => {
                                setGeneratedImages(prev => {
                                    const next = [...prev];
                                    if (next[i]) next[i] = next[i].map(x => x.id === img.id ? { ...x, flawSuggestions: s, isAnalyzing: false } : x);
                                    return next;
                                });
                            })
                            .catch(() => {
                                setGeneratedImages(prev => {
                                    const next = [...prev];
                                    if (next[i]) next[i] = next[i].map(x => x.id === img.id ? { ...x, isAnalyzing: false } : x);
                                    return next;
                                });
                            });

                        aiService.detectTextInImage(img.url)
                            .then(t => {
                                setGeneratedImages(prev => {
                                    const next = [...prev];
                                    if (next[i]) next[i] = next[i].map(x => x.id === img.id ? { ...x, detectedText: t, isDetectingText: false } : x);
                                    return next;
                                });
                            })
                            .catch(() => {
                                setGeneratedImages(prev => {
                                    const next = [...prev];
                                    if (next[i]) next[i] = next[i].map(x => x.id === img.id ? { ...x, isDetectingText: false } : x);
                                    return next;
                                });
                            });
                    });
                } catch (imgE) {
                    console.error(`Variant ${i} failed:`, imgE);
                }
            }
        } catch (e: any) {
            toast.error(e.message || 'Generation failed.', { id: mainToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-16 max-w-7xl mx-auto pb-24 px-4">
            {/* API Status Panel */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                        <Icon name="magic" className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-black text-white tracking-tight">OpenAI GPT-Image-2 Synthesis Active</p>
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">OpenAI Ready</span>
                        </div>
                        <p className="text-sm text-slate-300 font-medium">Powered by OpenAI's gpt-image-2, DALL-E 3 HD, and GPT-4o models.</p>
                    </div>
                </div>
                <button 
                    onClick={handleConnectKey} 
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                    CONFIGURE OPENAI KEY
                </button>
            </motion.div>

            {/* Input Dashboard */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 md:p-12 rounded-[3rem] space-y-12 border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.3)]"
            >
                <div className="flex flex-wrap gap-3">
                    {['topic', 'url', 'article', 'file', 'app-screenshot'].map((m: any) => (
                        <button 
                            key={m} 
                            onClick={() => setInputMode(m)} 
                            className={cn(
                                "px-8 py-4 rounded-2xl capitalize font-black transition-all tracking-wider",
                                inputMode === m 
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105" 
                                    : "bg-slate-900/40 text-slate-400 hover:bg-slate-800/60"
                            )}
                        >
                            {m === 'app-screenshot' ? 'App Campaign' : m}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    {inputMode === 'file' ? (
                        <div 
                            className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-20 text-center hover:border-blue-500/50 transition-all cursor-pointer bg-slate-950/30 group" 
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-slate-900 rounded-full group-hover:scale-110 transition-transform">
                                    <Icon name="file" className="h-10 w-10 text-slate-500 group-hover:text-blue-500" />
                                </div>
                                {selectedFile ? (
                                    <span className="text-blue-400 font-black text-xl">{selectedFile.name}</span>
                                ) : (
                                    <>
                                        <span className="text-slate-300 text-xl font-bold">Drop Research Papers (PDF)</span>
                                        <span className="text-slate-600 text-sm">AI will extract key findings and visualize them.</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : inputMode === 'app-screenshot' ? (
                        <div className="space-y-6">
                            <textarea 
                                value={sourceInput} 
                                onChange={e => setSourceInput(e.target.value)} 
                                placeholder="Enter your App URL (e.g., https://example.com)..."
                                className="w-full p-10 h-32 bg-slate-950/50 rounded-[2.5rem] border border-white/5 focus:ring-4 ring-blue-600/10 transition-all text-2xl font-medium placeholder:text-slate-700 resize-none"
                            />
                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-black tracking-tight">Number of Screenshots</h4>
                                    <p className="text-slate-500 text-sm">How many pages should the AI capture?</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="4" 
                                        max="8" 
                                        value={screenshotCount} 
                                        onChange={(e) => setScreenshotCount(parseInt(e.target.value))}
                                        className="w-32 accent-blue-500"
                                    />
                                    <span className="text-2xl font-black text-blue-400 w-8 text-center">{screenshotCount}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <textarea 
                                value={sourceInput} 
                                onChange={e => setSourceInput(e.target.value)} 
                                maxLength={inputMode === 'article' ? 50000 : undefined}
                                placeholder={inputMode === 'url' ? "Paste Article URL..." : inputMode === 'article' ? "Paste full article text (up to 50,000 characters)..." : "What complex topic should we analyze?"}
                                className="w-full p-10 h-48 bg-slate-950/50 rounded-[2.5rem] border border-white/5 focus:ring-4 ring-blue-600/10 transition-all text-2xl font-medium placeholder:text-slate-700 resize-none"
                            />
                            {inputMode === 'article' && (
                                <div className="absolute bottom-6 right-8 text-xs font-bold text-slate-500">
                                    {sourceInput.length} / 50,000
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* VISUAL STYLE SELECTOR */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-purple-500/20 rounded-xl">
                                <Icon name="brush" className="text-purple-400 h-6 w-6" />
                            </div>
                            Visual Aesthetic
                        </h3>
                         <div className="flex gap-2 overflow-x-auto pb-2 preset-scrollbar max-w-full md:max-w-md">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setStyleCategory(cat)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest",
                                        styleCategory === cat 
                                            ? 'bg-white text-slate-950 shadow-lg' 
                                            : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                   
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-4 preset-scrollbar">
                        {filteredPresets.map(s => (
                            <button 
                                key={s.id} 
                                onClick={() => setSelectedStyles([s])}
                                className={cn(
                                    "p-6 rounded-3xl border-2 transition-all text-left group flex flex-col h-full relative overflow-hidden",
                                    selectedStyles[0].id === s.id 
                                        ? 'border-blue-500 bg-blue-600/10 shadow-[0_10px_30px_rgba(37,99,235,0.2)]' 
                                        : 'border-white/5 bg-slate-900/40 hover:border-white/10 hover:bg-slate-800/60'
                                )}
                            >
                                <span className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">{s.category}</span>
                                <span className={cn(
                                    "font-black text-lg tracking-tight",
                                    selectedStyles[0].id === s.id ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'
                                )}>{s.name}</span>
                                {selectedStyles[0].id === s.id && (
                                    <motion.div 
                                        layoutId="activeStyle"
                                        className="absolute top-2 right-2"
                                    >
                                        <div className="bg-blue-500 rounded-full p-1">
                                            <Icon name="check" className="h-3 w-3 text-white" />
                                        </div>
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Studio Controls */}
                <details className="group border-t border-white/5 pt-12" open>
                    <summary className="cursor-pointer text-2xl font-black text-white flex items-center justify-between mb-10 select-none hover:text-blue-400 transition-colors tracking-tight">
                        <div className="flex items-center gap-3">
                            <span>Studio Controls</span>
                            <span className="text-slate-600 text-sm font-bold uppercase tracking-widest ml-4">Advanced Configuration</span>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-xl group-open:rotate-45 transition-transform">
                            <Icon name="plus" className="h-6 w-6" />
                        </div>
                    </summary>
                    <div className="grid lg:grid-cols-2 gap-16 animate-fadeIn">
                        {/* Column 1: Render Settings */}
                        <div className="space-y-10">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Complexity Level</label>
                                <div className="flex flex-wrap gap-3">
                                    <OptionButton label="Standard" value="balanced" selectedValue={advancedOptions.visualComplexity} onClick={v => updateOption('visualComplexity', v)} />
                                    <OptionButton label="High Detail" value="dense" selectedValue={advancedOptions.visualComplexity} onClick={v => updateOption('visualComplexity', v)} />
                                    <OptionButton label="Ultra-Technical" value="ultra-detailed" selectedValue={advancedOptions.visualComplexity} onClick={v => updateOption('visualComplexity', v)} icon="layout" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Narrative Structure</label>
                                <div className="flex flex-wrap gap-3">
                                    <OptionButton label="Linear" value="linear" selectedValue={advancedOptions.narrativePath} onClick={v => updateOption('narrativePath', v)} />
                                    <OptionButton label="Radial" value="radial" selectedValue={advancedOptions.narrativePath} onClick={v => updateOption('narrativePath', v)} />
                                    <OptionButton label="Flow" value="flow" selectedValue={advancedOptions.narrativePath} onClick={v => updateOption('narrativePath', v)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Lighting & Atmosphere</label>
                                <div className="flex flex-wrap gap-3">
                                    <OptionButton label="Cinematic" value="cinematic" selectedValue={advancedOptions.lighting} onClick={v => updateOption('lighting', v)} />
                                    <OptionButton label="Studio" value="studio" selectedValue={advancedOptions.lighting} onClick={v => updateOption('lighting', v)} />
                                    <OptionButton label="Neon" value="neon-cyberpunk" selectedValue={advancedOptions.lighting} onClick={v => updateOption('lighting', v)} />
                                    <OptionButton label="Golden Hour" value="golden-hour" selectedValue={advancedOptions.lighting} onClick={v => updateOption('lighting', v)} />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Render Engine</label>
                                <div className="flex flex-wrap gap-3">
                                    <OptionButton label="Unreal 5" value="unreal-engine-5" selectedValue={advancedOptions.renderEngine} onClick={v => updateOption('renderEngine', v)} />
                                    <OptionButton label="Octane" value="octane-render" selectedValue={advancedOptions.renderEngine} onClick={v => updateOption('renderEngine', v)} />
                                    <OptionButton label="Digital Paint" value="digital-painting" selectedValue={advancedOptions.renderEngine} onClick={v => updateOption('renderEngine', v)} />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Prompting & Data */}
                        <div className="space-y-8">
                            <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5">
                                <div className="flex items-center justify-between mb-8">
                                    <label className="block text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Data Injection</label>
                                    <button 
                                        onClick={handleMagicAutofill} 
                                        disabled={isAutofilling} 
                                        className={cn(
                                            "flex items-center gap-2 text-[10px] font-black px-6 py-3 rounded-full transition-all uppercase tracking-widest",
                                            isAutofilling 
                                                ? 'bg-slate-800 text-slate-600' 
                                                : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white shadow-lg shadow-blue-600/10'
                                        )}
                                    >
                                        {isAutofilling ? <Spinner /> : <Icon name="magic" className="h-3 w-3" />}
                                        MAGIC AUTOFILL
                                    </button>
                                </div>
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-4 preset-scrollbar">
                                    {advancedOptions.dataEntries.map((entry, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <input 
                                                type="text" 
                                                value={entry} 
                                                onChange={(e) => {
                                                    const d = [...advancedOptions.dataEntries];
                                                    d[idx] = e.target.value;
                                                    updateOption('dataEntries', d);
                                                }} 
                                                placeholder="e.g., 90% Success Rate" 
                                                className="flex-1 p-4 bg-slate-900/50 border border-white/5 focus:border-blue-500/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-700 transition-all" 
                                            />
                                            <button 
                                                onClick={() => updateOption('dataEntries', advancedOptions.dataEntries.filter((_, i) => i !== idx))} 
                                                className="text-slate-600 hover:text-red-500 p-2 transition-colors"
                                            >
                                                <Icon name="close" className="h-5 w-5"/>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => updateOption('dataEntries', [...advancedOptions.dataEntries, ''])} 
                                        className="w-full py-4 text-xs text-slate-500 font-black border-2 border-dashed border-white/5 rounded-xl hover:border-blue-500/50 hover:text-blue-400 transition-all uppercase tracking-widest"
                                    >
                                        + ADD DATA POINT
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-3 tracking-[0.2em]">Positive Prompt (Inclusions)</label>
                                <textarea 
                                    value={advancedOptions.positivePrompt} 
                                    onChange={e => updateOption('positivePrompt', e.target.value)} 
                                    className="w-full p-6 h-24 bg-slate-950/50 border border-white/5 rounded-2xl text-xs leading-relaxed text-slate-400 focus:border-blue-500/50 transition-all resize-none" 
                                    placeholder="e.g., sharp focus, 8k, vector labels..." 
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-3 tracking-[0.2em]">Negative Prompt (Exclusions)</label>
                                <textarea 
                                    value={advancedOptions.negativePrompt} 
                                    onChange={e => updateOption('negativePrompt', e.target.value)} 
                                    className="w-full p-6 h-24 bg-slate-950/50 border border-white/5 rounded-2xl text-xs leading-relaxed text-slate-400 focus:border-blue-500/50 transition-all resize-none" 
                                    placeholder="e.g., blurry, text artifacts, low res..." 
                                />
                            </div>
                        </div>
                    </div>
                </details>
            </motion.div>

            {/* Action Zone */}
            <div className="text-center">
                <button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !sourceInput}
                    className="group relative inline-flex items-center justify-center px-32 py-10 font-black text-3xl text-white bg-blue-600 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_30px_80px_-20px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isLoading ? <Spinner /> : <><Icon name="magic" className="mr-6 h-8 w-8" /> {inputMode === 'app-screenshot' ? 'GENERATE CAMPAIGN' : 'GENERATE 4 VARIANTS'}</>}
                </button>
            </div>

            {/* Render Quad-Grid */}
            <AnimatePresence>
                {contents.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid md:grid-cols-2 gap-12"
                    >
                        {contents.map((content, idx) => (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-panel p-10 rounded-[4rem] border-white/5 shadow-2xl space-y-10 flex flex-col relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                        Variant 0{idx + 1}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8">
                                    <h3 className="text-5xl font-black tracking-tighter text-white leading-[0.9]">{content.title}</h3>
                                    <ul className="space-y-4">
                                        {content.points.map((p, i) => (
                                            <li key={i} className="text-slate-400 text-lg font-medium flex gap-4 leading-relaxed">
                                                <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="relative aspect-square overflow-hidden rounded-[3rem] bg-slate-950 shadow-inner group border border-white/5">
                                    {generatedImages[idx]?.[0] ? (
                                        <ImageWithActions 
                                            image={generatedImages[idx][0]} 
                                            alt={content.title} 
                                            onExpand={setModalImageUrl}
                                            onRefine={(id, p, m) => aiService.refineInfographicImage(generatedImages[idx][0].url, p, m)}
                                            onAutoRefine={() => aiService.refineInfographicImage(generatedImages[idx][0].url, "Enhance detail and clarity", '')}
                                            onEnhance={() => aiService.enhanceInfographicImage(generatedImages[idx][0].url)}
                                            onRegenerate={() => handleRegenerate(idx)}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                                            <div className="relative">
                                                <Spinner />
                                                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                                            </div>
                                            <p className="text-sm font-black text-slate-500 tracking-[0.3em] uppercase animate-pulse">Synthesizing Visuals...</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {modalImageUrl && <ImageModal src={modalImageUrl} onClose={() => setModalImageUrl(null)} />}
            </AnimatePresence>
        </div>
    );
};
