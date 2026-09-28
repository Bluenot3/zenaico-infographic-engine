import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { InfographicGenerator } from './components/InfographicGenerator';
import { HistoryView } from './components/HistoryView';
import { SportsHub } from './components/SportsHub';
import { ChatBot } from './components/ChatBot';
import { SettingsPanel } from './components/SettingsPanel';
import { useApiSettings } from './hooks/useApiSettings';
import { Icon } from './components/common/Icon';
import { ZenLogo } from './components/common/ZenLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { historyService } from './services/historyService';
import { HistoryItem } from './types';
import { cn } from './lib/utils';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'studio' | 'sports' | 'history'>('studio');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [loadedHistoryItem, setLoadedHistoryItem] = useState<HistoryItem | null>(null);
  const { apiSettings, saveApiSettings } = useApiSettings();

  useEffect(() => {
    // Keep history count in sync
    const refreshCount = async () => {
      try {
        const items = await historyService.getHistory();
        setHistoryCount(items.length);
      } catch (e) {
        console.warn('Failed to fetch history count', e);
      }
    };
    refreshCount();
    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, [currentTab]);

  const handleLoadIntoStudio = (item: HistoryItem) => {
    setLoadedHistoryItem(item);
    setCurrentTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors theme="dark" />
      <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 md:p-8 selection:bg-blue-500/30 pb-28 md:pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Unified Navigation & Brand Header */}
          <motion.header 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel p-4 sm:p-5 rounded-[2rem] border-white/10 flex items-center justify-between gap-4 sticky top-3 z-30 shadow-2xl backdrop-blur-2xl"
          >
            {/* Left: Brand Identity with Official Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group select-none"
              onClick={() => setCurrentTab('studio')}
            >
              <ZenLogo size={42} engraved glow />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none group-hover:text-blue-400 transition-colors">
                    ZEN <span className="text-blue-500">AI Co.</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Studio
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                  Publication Visual Synthesizer
                </span>
              </div>
            </div>

            {/* Middle: Desktop View Switcher */}
            <div className="hidden md:flex items-center p-1.5 bg-black/60 border border-white/10 rounded-2xl shadow-inner gap-1">
              <button
                onClick={() => setCurrentTab('studio')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  currentTab === 'studio'
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon name="sparkles" className="h-4 w-4" />
                <span>Studio</span>
              </button>

              <button
                onClick={() => setCurrentTab('sports')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative",
                  currentTab === 'sports'
                    ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/30 font-black"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon name="trophy" className="h-4 w-4 text-amber-400" />
                <span>Live Sports Hub</span>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              </button>

              <button
                onClick={() => setCurrentTab('history')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  currentTab === 'history'
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon name="history" className="h-4 w-4" />
                <span>History Archive</span>
                {historyCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full",
                    currentTab === 'history' ? "bg-white/20 text-white" : "bg-white/10 text-blue-400"
                  )}>
                    {historyCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Model Status & Settings */}
            <div className="flex items-center gap-2.5">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">
                  {apiSettings.imageModel?.toUpperCase() || 'GPT-IMAGE-2'}
                </span>
              </div>

              <motion.button 
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsSettingsOpen(true)} 
                className="p-3 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md active:scale-95"
                aria-label="Open settings"
                title="API & Studio Settings"
              >
                <Icon name="settings" className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.header>

          {/* Subheader Hero text when on Studio tab */}
          {currentTab === 'studio' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2 sm:py-4 relative"
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white pb-2 tracking-tighter">
                Synthesize Publication-Grade Visuals
              </h1>
              <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-400 font-medium tracking-wide max-w-2xl mx-auto px-4">
                Powered by Google Gemini 3 Pro multimodal AI with authentic publication-ready studio verification engraving.
              </p>
            </motion.div>
          )}

          {/* Main Content Area */}
          <motion.main
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {currentTab === 'studio' ? (
              <InfographicGenerator 
                onOpenSettings={() => setIsSettingsOpen(true)}
                loadedHistoryItem={loadedHistoryItem}
                onViewHistory={() => setCurrentTab('history')}
                onViewSports={() => setCurrentTab('sports')}
              />
            ) : currentTab === 'sports' ? (
              <SportsHub 
                onLoadIntoStudio={handleLoadIntoStudio}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            ) : (
              <HistoryView 
                onLoadIntoStudio={handleLoadIntoStudio}
                onBackToStudio={() => setCurrentTab('studio')}
              />
            )}
          </motion.main>
          
          <ChatBot />

          <AnimatePresence>
            {isSettingsOpen && (
              <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentSettings={apiSettings}
                onSave={saveApiSettings}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Persistent Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-950/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-around gap-1.5">
          <button
            onClick={() => {
              setCurrentTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all min-h-[44px]",
              currentTab === 'studio'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Icon name="sparkles" className="h-4 w-4" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('sports');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all min-h-[44px]",
              currentTab === 'sports'
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Icon name="trophy" className="h-4 w-4 text-amber-400" />
            <span>Sports</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('history');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all min-h-[44px]",
              currentTab === 'history'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Icon name="history" className="h-4 w-4" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-2xl border border-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Settings"
          >
            <Icon name="settings" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
