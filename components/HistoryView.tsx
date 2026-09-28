import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { HistoryItem } from '../types';
import { historyService } from '../services/historyService';
import { downloadInfographicImage, createEngravedInfographic } from '../lib/engraveImage';
import { Icon } from './common/Icon';
import { ZenLogo } from './common/ZenLogo';
import { cn } from '../lib/utils';

interface HistoryViewProps {
  onLoadIntoStudio: (item: HistoryItem) => void;
  onBackToStudio: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onLoadIntoStudio,
  onBackToStudio,
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<string>('all');
  const [activeModalItem, setActiveModalItem] = useState<HistoryItem | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [previewEngraved, setPreviewEngraved] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const items = await historyService.getHistory();
      setHistoryItems(items);
    } catch (err) {
      console.error('Failed to load history', err);
      toast.error('Could not load generation history');
    }
  };

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.styleName && item.styleName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.points.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRatio =
        selectedRatio === 'all' || item.aspectRatio === selectedRatio;

      return matchesSearch && matchesRatio;
    });
  }, [historyItems, searchQuery, selectedRatio]);

  const handleDownload = async (item: HistoryItem, engrave: boolean) => {
    setIsProcessing(`download-${item.id}-${engrave}`);
    const toastId = toast.loading(
      engrave ? 'Applying official studio engraving...' : 'Preparing high-res download...'
    );

    try {
      const filename = `infographic_${item.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${engrave ? 'engraved' : 'raw'}.png`;
      await downloadInfographicImage(item.imageUrl, filename, {
        engrave,
        model: item.model,
        timestamp: item.timestamp,
      });
      toast.success(engrave ? 'Downloaded with studio hallmark engraving!' : 'Download complete!', {
        id: toastId,
      });
    } catch (err: any) {
      console.error('Download failed', err);
      toast.error('Download failed. Falling back to direct URL...', { id: toastId });
      const a = document.createElement('a');
      a.href = item.imageUrl;
      a.download = `zen_infographic_${Date.now()}.png`;
      a.click();
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCopy = async (item: HistoryItem) => {
    setIsProcessing(`copy-${item.id}`);
    try {
      const res = await fetch(item.imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('Visual copied to clipboard!');
    } catch (err) {
      console.error('Copy failed', err);
      toast.error('Failed to copy to clipboard.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this infographic from history?')) {
      await historyService.deleteItem(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      if (activeModalItem?.id === id) setActiveModalItem(null);
      toast.success('Removed from history');
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      await historyService.clearHistory();
      setHistoryItems([]);
      toast.success('History cleared');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header bar */}
      <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <ZenLogo size={48} engraved glow />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Infographic History & Archive
              </h2>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {historyItems.length} Saved
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span>Studio Certified Archive</span>
              <span aria-hidden="true">·</span>
              <span>Re-download with authentic metallic engraving</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onBackToStudio}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <Icon name="plus" className="h-5 w-5" />
            <span>Generate New</span>
          </button>
          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-3 text-slate-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-2xl border border-white/5 transition-colors"
              title="Clear all history"
            >
              <Icon name="trash" className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <Icon name="search" className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved infographics by topic, title, data points..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-950/60 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder:text-slate-500 focus:border-blue-500/60 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Aspect Ratio Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-white/10 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Ratios' },
            { id: '16:9', label: '16:9 Landscape' },
            { id: '1:1', label: '1:1 Square' },
            { id: '9:16', label: '9:16 Portrait' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRatio(tab.id)}
              className={cn(
                'px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all',
                selectedRatio === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Infographic Cards */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel p-12 sm:p-20 rounded-[2.5rem] border-white/5 text-center space-y-5">
          <div className="inline-flex p-4 rounded-3xl bg-slate-900 border border-white/10">
            <ZenLogo size={56} engraved />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {searchQuery ? 'No matching infographics found' : 'No history yet'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No visual items matched "${searchQuery}". Try a different keyword.`
              : 'Synthesize your first publication-grade infographic in the Studio to automatically archive it here.'}
          </p>
          <button
            onClick={onBackToStudio}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/30"
          >
            <Icon name="plus" className="h-4 w-4" />
            <span>Open Studio Generator</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-[2rem] border-white/5 overflow-hidden flex flex-col group transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            >
              {/* Image Preview with Engraved Badge Preview */}
              <div
                className="relative bg-slate-950 overflow-hidden cursor-pointer aspect-video sm:aspect-square md:aspect-video flex items-center justify-center"
                onClick={() => setActiveModalItem(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  crossOrigin="anonymous"
                />

                {/* Scrim Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                {/* ZEN AI Co. Engraving Seal Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 shadow-lg">
                    <ZenLogo size={20} engraved />
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                      Studio Engraved
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-slate-300 border border-white/10">
                    {item.aspectRatio}
                  </span>
                </div>

                {/* Floating Click to inspect overlay */}
                <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-xl flex items-center gap-2">
                    <Icon name="expand" className="h-4 w-4" />
                    Inspect Details
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-blue-400 font-semibold">{item.model.toUpperCase()}</span>
                    {item.styleName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[100px] text-slate-300">{item.styleName}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-black text-lg text-white tracking-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.topic}
                  </p>

                  {item.points && item.points.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      {item.points.slice(0, 2).map((pt, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                          <span className="text-blue-400 font-bold shrink-0">·</span>
                          <span className="truncate">{pt}</span>
                        </div>
                      ))}
                      {item.points.length > 2 && (
                        <div className="text-[10px] text-slate-500 font-semibold">
                          +{item.points.length - 2} more findings
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                  {/* Primary Re-Download with Engraving */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(item, true)}
                      disabled={isProcessing === `download-${item.id}-true`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                      title="Download with authentic ZEN AI Co. engraved hallmark"
                    >
                      <Icon name="stamp" className="h-4 w-4 text-blue-200" />
                      <span>Re-Download Engraved</span>
                    </button>

                    <button
                      onClick={() => handleDownload(item, false)}
                      disabled={isProcessing === `download-${item.id}-false`}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all text-xs font-bold"
                      title="Download clean raw image"
                    >
                      <Icon name="download" className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-all"
                      title="Delete from history"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Secondary: Open in Studio */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onLoadIntoStudio(item);
                        toast.success(`Loaded "${item.title}" into Studio`);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-white/5 transition-all flex items-center justify-center gap-2"
                    >
                      <Icon name="refresh" className="h-3.5 w-3.5 text-blue-400" />
                      <span>Refine in Studio</span>
                    </button>

                    <button
                      onClick={() => handleCopy(item)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-white/5 transition-all"
                      title="Copy to clipboard"
                    >
                      <Icon name="copy" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Detail & Fullscreen Inspection */}
      <AnimatePresence>
        {activeModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
            onClick={() => setActiveModalItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-[2.5rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto preset-scrollbar flex flex-col md:flex-row shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image side */}
              <div className="md:w-3/5 bg-black flex flex-col items-center justify-center p-4 sm:p-6 relative">
                <img
                  src={activeModalItem.imageUrl}
                  alt={activeModalItem.title}
                  className="max-h-[60vh] md:max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl"
                  crossOrigin="anonymous"
                />

                <div className="mt-4 flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                    <ZenLogo size={20} engraved />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                      Studio Master Asset
                    </span>
                  </div>
                </div>
              </div>

              {/* Info & Download Controls Side */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {activeModalItem.model}
                    </span>
                    <button
                      onClick={() => setActiveModalItem(null)}
                      className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Icon name="close" className="h-5 w-5" />
                    </button>
                  </div>

                  <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
                    {activeModalItem.title}
                  </h2>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p><strong className="text-slate-300">Topic:</strong> {activeModalItem.topic}</p>
                    {activeModalItem.styleName && (
                      <p><strong className="text-slate-300">Aesthetic:</strong> {activeModalItem.styleName}</p>
                    )}
                    <p><strong className="text-slate-300">Generated:</strong> {new Date(activeModalItem.timestamp).toLocaleString()}</p>
                  </div>

                  {activeModalItem.points && activeModalItem.points.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Key Synthesized Data Points
                      </h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto preset-scrollbar pr-2">
                        {activeModalItem.points.map((pt, i) => (
                          <div key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                            <span className="text-blue-400 font-bold">{i + 1}.</span>
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Download Actions inside modal */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleDownload(activeModalItem, true)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Icon name="stamp" className="h-5 w-5" />
                    <span>Download with Studio Hallmark Engraving</span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownload(activeModalItem, false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Icon name="download" className="h-4 w-4" />
                      <span>Download Clean Raw</span>
                    </button>

                    <button
                      onClick={() => {
                        onLoadIntoStudio(activeModalItem);
                        setActiveModalItem(null);
                        toast.success('Loaded into Studio for refinement');
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs uppercase tracking-wider border border-blue-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Icon name="refresh" className="h-4 w-4" />
                      <span>Load into Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
