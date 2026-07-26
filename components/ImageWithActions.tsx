
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Icon } from './common/Icon';
import type { GeneratedImage, DetectedText, BoundingBox } from '../types';
import { Spinner } from './common/Spinner';
import { ImageEditor } from './ImageEditor';
import { cn } from '../lib/utils';

interface ImageWithActionsProps {
  image: GeneratedImage;
  alt: string;
  onExpand: (url: string) => void;
  onRefine: (imageId: number, editPrompt: string, maskImage?: string) => Promise<void>;
  onAutoRefine: (imageId: number) => Promise<void>;
  onEnhance: (imageId: number) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export const ImageWithActions: React.FC<ImageWithActionsProps> = ({ 
  image, alt, onExpand, onRefine, onAutoRefine, onEnhance, onRegenerate 
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTextEditMode, setIsTextEditMode] = useState(false);
  const [showDataCard, setShowDataCard] = useState(false);
  const [dataRefinePrompt, setDataRefinePrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [localTexts, setLocalTexts] = useState<DetectedText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (image.detectedText) setLocalTexts(image.detectedText);
  }, [image.detectedText, image.url]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `zen_infographic_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloading high-resolution visual...");
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopySuccess(true);
      toast.success("Visual copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
      toast.error("Failed to copy visual.");
    }
  };

  const handleAction = async (task: () => Promise<any>, message: string) => {
    setIsProcessing(true);
    const actionToast = toast.loading(message);
    try { 
      await task(); 
      toast.success("Action complete!", { id: actionToast });
    } catch (err: any) {
      toast.error(err.message || "Action failed", { id: actionToast });
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleAddText = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const newText: DetectedText = {
      id: `new-${Date.now()}`,
      text: "New Label",
      boundingBox: { x: x - 0.05, y: y - 0.02, width: 0.1, height: 0.04 }
    };
    setLocalTexts([...localTexts, newText]);
    toast.info("New text anchor added.");
  };

  const handleDuplicate = (e: React.MouseEvent, t: DetectedText) => {
    e.stopPropagation();
    const dupe: DetectedText = {
      ...t,
      id: `dupe-${Date.now()}`,
      boundingBox: { ...t.boundingBox, y: t.boundingBox.y + 0.05 }
    };
    setLocalTexts([...localTexts, dupe]);
    toast.info("Text anchor duplicated.");
  };

  const handleMagicDone = async () => {
    const changed = localTexts.filter(t => !image.detectedText.find(orig => orig.id === t.id && orig.text === t.text));
    if (changed.length === 0) {
      setIsTextEditMode(false);
      return;
    }

    let prompt = "Update specific text blocks in the infographic: ";
    changed.forEach(t => prompt += `Change area at [${t.boundingBox.x}, ${t.boundingBox.y}] to "${t.text}". `);
    
    setIsProcessing(true);
    const magicToast = toast.loading("Applying neural text corrections...");
    try {
      await onRefine(image.id, prompt);
      toast.success("Text corrections applied!", { id: magicToast });
    } catch (err: any) {
      toast.error(err.message || "Text correction failed", { id: magicToast });
    } finally {
      setIsProcessing(false);
      setIsTextEditMode(false);
    }
  };

  const isAnyLoading = image.isAnalyzing || image.isDetectingText || image.isRefining || isProcessing;

  return (
    <>
      <div className={cn(
        "relative group glass-panel p-3 rounded-[3rem] overflow-hidden transition-all duration-500 border-white/5",
        image.isRefining && "ring-4 ring-blue-500/50"
      )}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950">
          <motion.img 
            ref={imageRef} 
            src={image.url || ''} 
            alt={alt} 
            className="w-full rounded-[2.5rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.05]" 
            crossOrigin="anonymous"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          
          {/* Action Bar overlay */}
          <div className={cn(
            "absolute inset-0 bg-slate-950/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 z-10",
            (isAnyLoading || isTextEditMode) && "pointer-events-none opacity-0"
          )}>
            <div className="grid grid-cols-4 gap-4 p-6">
              {[
                { icon: 'refresh', color: 'bg-blue-600', label: 'Regen', action: () => handleAction(onRegenerate, "Regenerating visual...") },
                { icon: 'brush', color: 'bg-purple-600', label: 'Brush', action: () => setIsEditorOpen(true) },
                { icon: 'text', color: 'bg-amber-600', label: 'Magic Text', action: () => setIsTextEditMode(true) },
                { icon: 'database', color: 'bg-indigo-600', label: 'Data', action: () => setShowDataCard(true) },
                { icon: 'expand', color: 'bg-slate-600', label: 'Expand', action: () => onExpand(image.url) },
                { icon: 'download', color: 'bg-emerald-600', label: 'Save', action: handleDownload },
                { icon: 'copy', color: 'bg-cyan-600', label: 'Copy', action: handleCopy },
                { icon: 'refine', color: 'bg-rose-600', label: 'Enhance', action: () => handleAction(() => onEnhance(image.id), "Enhancing visual quality...") }
              ].map((btn, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={btn.action} 
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-3xl text-white transition-all border border-white/10",
                    btn.color
                  )}
                >
                  <Icon name={btn.icon} className="h-6 w-6"/>
                  <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Data Refinement Layer */}
          <AnimatePresence>
            {showDataCard && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm"
                onClick={() => setShowDataCard(false)}
              >
                <div 
                  className="w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8 space-y-6"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
                      <Icon name="database" className="text-indigo-400 h-6 w-6" />
                      Data Control
                    </h3>
                    <button onClick={() => setShowDataCard(false)} className="text-white/50 hover:text-white transition-colors">
                      <Icon name="close" className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <textarea
                    value={dataRefinePrompt}
                    onChange={e => setDataRefinePrompt(e.target.value)}
                    placeholder="Specify data to add or remove (optional)..."
                    className="w-full h-24 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/40 focus:border-indigo-500/50 transition-all resize-none outline-none"
                  />
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        handleAction(() => onRefine(image.id, "Remove some data points and simplify the information. " + (dataRefinePrompt ? "Specifically remove: " + dataRefinePrompt : "")), "Simplifying data...");
                        setShowDataCard(false);
                        setDataRefinePrompt('');
                      }}
                      className="flex-1 py-4 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      - Less Data
                    </button>
                    <button 
                      onClick={() => {
                        handleAction(() => onRefine(image.id, "Add more detailed statistics, numbers, and data points to the infographic. " + (dataRefinePrompt ? "Specifically add: " + dataRefinePrompt : "")), "Adding more data...");
                        setShowDataCard(false);
                        setDataRefinePrompt('');
                      }}
                      className="flex-1 py-4 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      + More Data
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Indicator */}
          <AnimatePresence>
            {isAnyLoading && !isTextEditMode && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center rounded-[2.5rem] z-20"
              >
                <div className="relative">
                  <Spinner />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"
                  />
                </div>
                <p className="mt-8 text-white font-black tracking-[0.3em] text-xs uppercase animate-pulse">
                  {image.isRefining ? 'Neural Refinement...' : 
                   image.isDetectingText ? 'Optical Analysis...' : 
                   image.isAnalyzing ? 'Structural Check...' : 'Studio Processing...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Magic Text Layer */}
          <AnimatePresence>
            {isTextEditMode && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 cursor-crosshair z-30 bg-slate-950/40 backdrop-blur-sm" 
                onClick={handleAddText}
              >
                <div className="absolute top-6 left-0 right-0 flex justify-center">
                  <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                    Magic Text Mode: Click to add labels
                  </div>
                </div>

                {localTexts.map(t => (
                  <motion.div 
                    key={t.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute border-2 border-blue-500 bg-blue-500/20 hover:bg-blue-500/40 transition-colors group/text rounded-xl shadow-2xl backdrop-blur-md"
                    style={{
                      left: `${t.boundingBox.x * 100}%`,
                      top: `${t.boundingBox.y * 100}%`,
                      width: `${t.boundingBox.width * 100}%`,
                      height: `${t.boundingBox.height * 100}%`,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <textarea
                      value={t.text}
                      onChange={e => setLocalTexts(prev => prev.map(item => item.id === t.id ? { ...item, text: e.target.value } : item))}
                      className="w-full h-full bg-transparent text-[10px] text-white outline-none resize-none p-2 font-black text-center leading-tight placeholder:text-white/50"
                      placeholder="Type here..."
                    />
                    <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover/text:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDuplicate(e, t)}
                        className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <Icon name="copy" className="h-3 w-3"/>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setLocalTexts(prev => prev.filter(item => item.id !== t.id)); }}
                        className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <Icon name="close" className="h-3 w-3"/>
                      </button>
                    </div>
                  </motion.div>
                ))}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 px-4">
                  <button onClick={() => setIsTextEditMode(false)} className="px-10 py-4 bg-slate-900/90 text-white rounded-2xl font-black uppercase tracking-widest border border-white/10 backdrop-blur-xl hover:bg-slate-800 transition-all active:scale-95">Cancel</button>
                  <button onClick={handleMagicDone} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all active:scale-95">Apply Corrections</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Edit Prompt */}
        <div className="mt-6 p-2 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={editPrompt} 
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="Neural instructions (e.g., 'Make it glow')..."
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-500/50 transition-all outline-none text-slate-200 placeholder:text-slate-700"
              />
            </div>
            <button 
              onClick={() => handleAction(() => onRefine(image.id, editPrompt), "Applying neural refinement...")}
              disabled={!editPrompt.trim() || isAnyLoading}
              className="px-6 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Icon name="send" className="h-6 w-6"/>
            </button>
          </div>
          {image.flawSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {image.flawSuggestions.slice(0, 3).map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => setEditPrompt(s)} 
                  className="text-[10px] font-black uppercase tracking-widest bg-slate-900/60 hover:bg-blue-600/20 text-slate-500 hover:text-blue-400 px-4 py-2 rounded-xl transition-all border border-white/5"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditorOpen && (
          <ImageEditor
            imageSrc={image.url}
            onClose={() => setIsEditorOpen(false)}
            onSubmit={(p, m) => onRefine(image.id, p, m)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
