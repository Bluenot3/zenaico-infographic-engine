
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Icon } from './common/Icon';
import type { GeneratedImage, DetectedText, BoundingBox } from '../types';
import { Spinner } from './common/Spinner';
import { ImageEditor } from './ImageEditor';
import { ZenLogo } from './common/ZenLogo';
import { downloadInfographicImage } from '../lib/engraveImage';
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
  const [showMobileActions, setShowMobileActions] = useState(false);
  
  const [localTexts, setLocalTexts] = useState<DetectedText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (image.detectedText) setLocalTexts(image.detectedText);
  }, [image.detectedText, image.url]);

  const handleDownload = async (engrave: boolean = true) => {
    setIsProcessing(true);
    const toastId = toast.loading(engrave ? "Applying studio engraved hallmark..." : "Downloading visual...");
    try {
      const filename = `infographic_${Date.now()}_${engrave ? 'engraved' : 'raw'}.png`;
      await downloadInfographicImage(image.url, filename, { engrave, model: 'gemini-3-pro-image', timestamp: Date.now() });
      toast.success(engrave ? "Downloaded with studio hallmark engraving!" : "Download complete!", { id: toastId });
    } catch (err: any) {
      console.error('Download failed', err);
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `infographic_${Date.now()}.png`;
      link.click();
      toast.success("Downloaded visual", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
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
          
          {/* Verified Insignia Stamp Overlay */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 shadow-xl">
              <ZenLogo size={20} engraved />
              <span className="text-[10px] font-black tracking-wider uppercase text-white">
                Studio 4K Verified
              </span>
            </div>
          </div>

          {/* Action Bar overlay (Desktop Hover & Mobile Tap) */}
          <div className={cn(
            "absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-4 z-10",
            (isAnyLoading || isTextEditMode) ? "pointer-events-none opacity-0" : (
              showMobileActions ? "opacity-100 pointer-events-auto" : "opacity-0 md:group-hover:opacity-100 pointer-events-none md:pointer-events-auto"
            )
          )}>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 max-w-md w-full">
              {[
                { icon: 'refresh', color: 'bg-blue-600', label: 'Regen', action: () => handleAction(onRegenerate, "Regenerating visual...") },
                { icon: 'brush', color: 'bg-purple-600', label: 'Brush', action: () => setIsEditorOpen(true) },
                { icon: 'text', color: 'bg-amber-600', label: 'Magic Text', action: () => setIsTextEditMode(true) },
                { icon: 'database', color: 'bg-indigo-600', label: 'Data', action: () => setShowDataCard(true) },
                { icon: 'expand', color: 'bg-slate-600', label: 'Expand', action: () => onExpand(image.url) },
                { icon: 'stamp', color: 'bg-gradient-to-r from-blue-600 to-indigo-600', label: 'Engraved', action: () => handleDownload(true) },
                { icon: 'download', color: 'bg-emerald-600', label: 'Raw Save', action: () => handleDownload(false) },
                { icon: 'copy', color: 'bg-cyan-600', label: 'Copy', action: handleCopy },
                { icon: 'refine', color: 'bg-rose-600', label: 'Enhance', action: () => handleAction(() => onEnhance(image.id), "Enhancing visual quality...") }
              ].slice(0, 8).map((btn, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={btn.action} 
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl text-white transition-all border border-white/10 shadow-lg min-h-[64px]",
                    btn.color
                  )}
                >
                  <Icon name={btn.icon} className="h-5 w-5"/>
                  <span className="text-[9px] font-black uppercase tracking-wider text-center">{btn.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Mobile close overlay button */}
            {showMobileActions && (
              <button 
                onClick={() => setShowMobileActions(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full md:hidden"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Mobile Tap Target Indicator */}
          <div 
            onClick={() => setShowMobileActions(prev => !prev)}
            className="md:hidden absolute inset-0 z-0 cursor-pointer"
            aria-label="Tap to view actions"
          />

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

        {/* Mobile Quick Action Strip (Touch-Optimized) */}
        <div className="md:hidden mt-4 flex items-center gap-2 overflow-x-auto pb-1 preset-scrollbar">
          <button
            onClick={() => handleDownload(true)}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95"
          >
            <Icon name="stamp" className="h-4 w-4" />
            <span>Engraved Save</span>
          </button>
          <button
            onClick={() => handleAction(onRegenerate, "Regenerating visual...")}
            className="flex items-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-xs font-semibold active:scale-95 whitespace-nowrap"
          >
            <Icon name="refresh" className="h-4 w-4 text-blue-400" />
            <span>Regen</span>
          </button>
          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-xs font-semibold active:scale-95 whitespace-nowrap"
          >
            <Icon name="brush" className="h-4 w-4 text-purple-400" />
            <span>Brush</span>
          </button>
          <button
            onClick={() => onExpand(image.url)}
            className="p-3 rounded-2xl bg-slate-900 border border-white/10 text-white active:scale-95"
            title="Expand"
          >
            <Icon name="expand" className="h-4 w-4" />
          </button>
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
