import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { ApiSettings, ApiProvider, ImageModelOption, TextModelOption } from '../types';
import { Icon } from './common/Icon';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
}

const ProviderButton: React.FC<{
    label: string;
    provider: ApiProvider;
    currentProvider: ApiProvider;
    onClick: (provider: ApiProvider) => void;
    disabled?: boolean;
}> = ({ label, provider, currentProvider, onClick, disabled }) => (
    <button
        onClick={() => onClick(provider)}
        disabled={disabled}
        className={`px-4 py-3 rounded-2xl transition-all text-sm w-full text-center font-bold border ${
            currentProvider === provider 
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
              : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/60 text-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {label}
    </button>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [settings, setSettings] = useState<ApiSettings>(currentSettings);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-panel rounded-[2.5rem] w-full max-w-xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-white/10 max-h-[90vh] overflow-y-auto preset-scrollbar" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500" />
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <Icon name="close" className="h-6 w-6" />
        </button>
        
        <div className="text-center space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight">
                AI Synthesis Engine
            </h2>
            <p className="text-slate-400 text-xs font-medium">
                Configure OpenAI gpt-image-2 and Google model credentials.
            </p>
        </div>

        {/* OpenAI API Key Section */}
        <div className="space-y-3 bg-slate-950/60 p-5 rounded-3xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <Icon name="settings" className="h-4 w-4" />
                    </div>
                    <label className="text-sm font-bold text-white">OpenAI API Key</label>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {settings.openaiApiKey ? 'Key Saved' : 'Optional / Env'}
                </span>
            </div>
            <div className="relative">
                <input 
                    type={showOpenAiKey ? "text" : "password"}
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => setSettings(s => ({ ...s, openaiApiKey: e.target.value }))}
                    placeholder="sk-proj-..."
                    className="w-full p-3.5 pr-10 bg-slate-900/80 border border-white/10 rounded-2xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button 
                    type="button"
                    onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white text-xs font-bold"
                >
                    {showOpenAiKey ? "Hide" : "Show"}
                </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
                Enter your OpenAI secret key (`sk-...`) to generate infographics with <strong className="text-emerald-400">gpt-image-2</strong> and <strong className="text-emerald-400">DALL-E 3</strong>.
            </p>
        </div>
        
        {/* Provider Selection */}
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Icon name="settings" className="h-4 w-4 text-blue-500" />
                <label className="text-sm font-bold text-white">Primary AI Provider</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <ProviderButton label="OpenAI" provider="openai" currentProvider={settings.provider} onClick={(p) => setSettings(s => ({...s, provider: p}))} />
                <ProviderButton label="Google" provider="google" currentProvider={settings.provider} onClick={(p) => setSettings(s => ({...s, provider: p}))} />
                <ProviderButton label="Hybrid" provider="hybrid" currentProvider={settings.provider} onClick={(p) => setSettings(s => ({...s, provider: p}))} />
            </div>
        </div>

        {/* Image Model Selection */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon name="image" className="h-4 w-4 text-purple-400" />
                    <label className="text-sm font-bold text-white">Image Model</label>
                </div>
                <span className="text-[10px] font-black uppercase text-blue-400">Newest OpenAI Models</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, imageModel: 'gpt-image-2' as ImageModelOption }))}
                    className={`p-3.5 rounded-2xl transition-all text-left border-2 ${
                        settings.imageModel === 'gpt-image-2' 
                            ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-emerald-400">GPT-Image-2</span>
                        <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full uppercase">FLAGSHIP</span>
                    </div>
                    <span className="block text-[11px] opacity-70 mt-1">OpenAI Next-Gen high-definition visual synthesizer.</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, imageModel: 'dall-e-3' as ImageModelOption }))}
                    className={`p-3.5 rounded-2xl transition-all text-left border-2 ${
                        settings.imageModel === 'dall-e-3' 
                            ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/10' 
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/50'
                    }`}
                >
                    <span className="block font-black text-sm text-blue-400">DALL-E 3 HD</span>
                    <span className="block text-[11px] opacity-70 mt-1">OpenAI HD 1024x1024 / 1792x1024 rendering.</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, imageModel: 'dall-e-2' as ImageModelOption }))}
                    className={`p-3.5 rounded-2xl transition-all text-left border-2 ${
                        settings.imageModel === 'dall-e-2' 
                            ? 'bg-blue-600/10 border-blue-500 text-white' 
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/50'
                    }`}
                >
                    <span className="block font-bold text-sm text-slate-200">DALL-E 2</span>
                    <span className="block text-[11px] opacity-70 mt-1">Fast OpenAI image generator.</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, imageModel: 'gemini-3-pro-image-preview' as ImageModelOption }))}
                    className={`p-3.5 rounded-2xl transition-all text-left border-2 ${
                        settings.imageModel === 'gemini-3-pro-image-preview' 
                            ? 'bg-purple-600/10 border-purple-500 text-white' 
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/50'
                    }`}
                >
                    <span className="block font-bold text-sm text-purple-300">Gemini 3 Pro</span>
                    <span className="block text-[11px] opacity-70 mt-1">Google high-fidelity image model.</span>
                </button>
            </div>
        </div>

        {/* Text / Concept Model Selection */}
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Icon name="brush" className="h-4 w-4 text-blue-400" />
                <label className="text-sm font-bold text-white">Text & Concept Reasoning Model</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, textModel: 'gpt-4o' as TextModelOption }))}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all border ${
                        settings.textModel === 'gpt-4o' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/60 border-white/5 text-slate-400'
                    }`}
                >
                    GPT-4o
                </button>
                <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, textModel: 'gpt-4o-mini' as TextModelOption }))}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all border ${
                        settings.textModel === 'gpt-4o-mini' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/60 border-white/5 text-slate-400'
                    }`}
                >
                    GPT-4o Mini
                </button>
                <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, textModel: 'o3-mini' as TextModelOption }))}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all border ${
                        settings.textModel === 'o3-mini' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/60 border-white/5 text-slate-400'
                    }`}
                >
                    o3-mini
                </button>
            </div>
        </div>

        <div className="pt-2">
            <button 
                onClick={handleSave} 
                className="w-full btn-primary text-white font-black py-3.5 px-6 rounded-2xl text-lg shadow-xl shadow-blue-600/20 hover:scale-[1.01] active:scale-95 transition-all"
            >
                Save Settings
            </button>
        </div>
      </motion.div>
    </div>
  );
};
