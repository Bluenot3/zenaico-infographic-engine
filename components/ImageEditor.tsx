import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';

interface ImageEditorProps {
    imageSrc: string;
    onClose: () => void;
    onSubmit: (prompt: string, maskDataUrl: string) => Promise<void>;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onClose, onSubmit }) => {
    const [prompt, setPrompt] = useState('');
    const [brushSize, setBrushSize] = useState(40);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    const resizeCanvas = useCallback(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (image && canvas) {
            canvas.width = image.clientWidth;
            canvas.height = image.clientHeight;
        }
    }, []);

    useEffect(() => {
        const image = imageRef.current;
        if (!image) return;

        image.addEventListener('load', resizeCanvas);
        window.addEventListener('resize', resizeCanvas);
        
        if (image.complete) {
            resizeCanvas();
        }

        return () => {
            image.removeEventListener('load', resizeCanvas);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [resizeCanvas]);


    const getMousePos = (e: React.MouseEvent): { x: number, y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const draw = useCallback((e: React.MouseEvent) => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const pos = getMousePos(e);
        
        ctx.beginPath();
        if (lastPos.current) {
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
        }
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        lastPos.current = pos;
    }, [brushSize]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDrawing.current = true;
        lastPos.current = getMousePos(e);
        draw(e);
    }, [draw]);

    const handleMouseUp = useCallback(() => {
        isDrawing.current = false;
        lastPos.current = null;
    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !canvasRef.current) return;
        setIsSubmitting(true);
        
        try {
            const originalImage = new Image();
            originalImage.src = imageSrc;
            await new Promise(resolve => { originalImage.onload = resolve });

            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = originalImage.naturalWidth;
            maskCanvas.height = originalImage.naturalHeight;
            const maskCtx = maskCanvas.getContext('2d');

            if (maskCtx) {
                maskCtx.drawImage(
                    canvasRef.current,
                    0, 0, canvasRef.current.width, canvasRef.current.height,
                    0, 0, maskCanvas.width, maskCanvas.height
                );
            }
            
            const maskDataUrl = maskCanvas.toDataURL('image/png');
            await onSubmit(prompt, maskDataUrl);
        } catch (error) {
            console.error("Edit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onMouseUp={handleMouseUp}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel rounded-[2.5rem] w-full max-w-5xl p-6 md:p-8 space-y-6 flex flex-col max-h-[95vh] relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-white/10" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Icon name="edit" className="h-6 w-6 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Precision Brush</h2>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <Icon name="close" className="h-6 w-6" />
                    </button>
                </header>

                <div className="flex-grow relative flex items-center justify-center min-h-0 bg-black/40 rounded-3xl overflow-hidden border border-white/5">
                    <img ref={imageRef} src={imageSrc} alt="Editing image" className="max-w-full max-h-full object-contain select-none" />
                    <canvas 
                        ref={canvasRef} 
                        className="absolute top-0 left-0 right-0 bottom-0 m-auto cursor-crosshair"
                        onMouseDown={handleMouseDown}
                        onMouseMove={draw}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>
                
                <div className="bg-white/5 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 flex-shrink-0 border border-white/5">
                    <div className="flex-1 w-full space-y-2">
                        <div className="flex justify-between text-sm font-bold text-slate-400">
                            <span>Brush Size</span>
                            <span>{brushSize}px</span>
                        </div>
                        <input
                            id="brushSize"
                            type="range"
                            min="5"
                            max="150"
                            value={brushSize}
                            onChange={e => setBrushSize(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            disabled={isSubmitting}
                        />
                    </div>
                    <button 
                        onClick={clearCanvas} 
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all active:scale-95 whitespace-nowrap border border-white/5" 
                        disabled={isSubmitting}
                    >
                        Clear Mask
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-3 items-center flex-shrink-0">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Describe the change... e.g., 'Correct spelling to ZEN'"
                            className="w-full p-5 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                            disabled={isSubmitting}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn-primary text-white font-black p-5 rounded-2xl disabled:opacity-50 flex items-center shadow-lg shadow-blue-600/20 hover:scale-[1.05] active:scale-95 transition-all" 
                        disabled={!prompt.trim() || isSubmitting}
                    >
                        {isSubmitting ? <Spinner /> : <Icon name="send" className="h-6 w-6" />}
                    </button>
                </form>

                <AnimatePresence>
                    {isSubmitting && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10"
                        >
                            <div className="relative">
                                <Spinner />
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"
                                />
                            </div>
                            <p className="mt-8 text-2xl font-black tracking-tight">Synthesizing Edits...</p>
                            <p className="mt-2 text-slate-400 font-medium">Applying neural corrections to your visual.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
