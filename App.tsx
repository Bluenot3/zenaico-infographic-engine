import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { InfographicGenerator } from './components/InfographicGenerator';
import { ChatBot } from './components/ChatBot';
import { SettingsPanel } from './components/SettingsPanel';
import { useApiSettings } from './hooks/useApiSettings';
import { Icon } from './components/common/Icon';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { apiSettings, saveApiSettings } = useApiSettings();

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors theme="dark" />
      <div className="min-h-screen p-4 md:p-8 selection:bg-blue-500/30">
        <div className="max-w-7xl mx-auto">
          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12 relative"
          >
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-5xl md:text-7xl font-black text-white pb-2 tracking-tighter" 
              style={{textShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'}}
            >
              ZEN <span className="text-blue-500">Studio</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg md:text-xl text-slate-400 font-medium tracking-wide max-w-2xl mx-auto"
            >
              Synthesize publication-ready infographics with state-of-the-art AI.
            </motion.p>
            
            <motion.button 
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSettingsOpen(true)} 
              className="absolute top-0 right-0 p-3 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full border border-white/5 backdrop-blur-md"
              aria-label="Open settings"
            >
              <Icon name="settings" className="h-6 w-6" />
            </motion.button>
          </motion.header>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <InfographicGenerator onOpenSettings={() => setIsSettingsOpen(true)} />
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
      </div>
    </ErrorBoundary>
  );
};

export default App;
