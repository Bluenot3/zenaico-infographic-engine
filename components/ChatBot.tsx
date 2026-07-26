import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessage } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { cn } from '../lib/utils';

export const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'model', text: 'Hello! How can I help you create something amazing today?' }]);
        }
    }, [isOpen, messages.length]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendMessage(newMessages);
            const modelMessage: ChatMessage = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please ensure your API keys are correct in settings or try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, messages]);

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 btn-primary text-white p-5 rounded-full shadow-2xl z-40 hover:scale-110 active:scale-95"
                        aria-label="Open Chat"
                    >
                        <Icon name="chat" className="h-7 w-7" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 right-8 w-[calc(100vw-2rem)] sm:w-full sm:max-w-md h-[70vh] max-h-[600px] glass-panel rounded-[2rem] flex flex-col z-50 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border-white/10"
                    >
                        <header className="bg-white/5 p-6 flex justify-between items-center border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <h3 className="text-lg font-black text-white tracking-tight">ZEN Assistant</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                                <Icon name="close" className="h-6 w-6" />
                            </button>
                        </header>
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 preset-scrollbar">
                            {messages.map((msg, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={index} 
                                    className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                >
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl px-5 py-3 text-sm font-medium leading-relaxed",
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 rounded-tr-none' 
                                            : 'bg-slate-800/50 text-slate-200 border border-white/5 rounded-tl-none'
                                    )}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                     <div className="bg-slate-800/50 rounded-2xl px-5 py-3 border border-white/5 rounded-tl-none">
                                       <Spinner />
                                    </div>
                                </div>
                            )}
                             <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6 bg-white/5 border-t border-white/5">
                            <div className="flex items-center bg-slate-950/50 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your research..."
                                    className="flex-1 bg-transparent p-4 text-sm focus:outline-none text-slate-200 placeholder:text-slate-600"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit" 
                                    className="p-4 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-colors" 
                                    disabled={isLoading || !input.trim()}
                                >
                                    <Icon name="send" className="h-6 w-6" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
