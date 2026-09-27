import { HistoryItem } from '../types';

const DB_NAME = 'zen_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'infographics_history';
const LOCAL_STORAGE_FALLBACK_KEY = 'zen_infographics_history_v1';

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback localStorage helpers
function getFromLocalStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('LocalStorage read error:', e);
    return [];
  }
}

function saveToLocalStorage(items: HistoryItem[]) {
  try {
    // Only keep latest 20 in localStorage to prevent 5MB quota overflow
    const trimmed = items.slice(0, 20);
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('LocalStorage save error (likely quota):', e);
  }
}

// Default initial showcase entries demonstrating ZEN AI Co. aesthetic
const SEED_HISTORY_ITEMS: HistoryItem[] = [
  {
    id: 'zen-showcase-01',
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    title: 'Autonomous Clean Energy Microgrid Architecture',
    topic: 'Solar, Wind, Battery Storage & AI Grid Orchestration',
    points: [
      '84% Peak Load Shifting through predictive neural battery dispatching',
      'Real-time frequency modulation (50Hz/60Hz) with sub-10ms response time',
      'Distributed ledger smart contracts for peer-to-peer neighborhood power trading',
      'Zero-carbon islanding capability during regional blackout contingencies'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80',
    aspectRatio: '16:9',
    model: 'gpt-image-2',
    styleName: 'Blueprint Architectural',
    category: 'Architecture',
    layout: 'data-heavy',
    engraved: true,
  },
  {
    id: 'zen-showcase-02',
    timestamp: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago
    title: 'Quantum Computing Fault-Tolerant Logical Qubits',
    topic: 'Surface Codes, Topological Braiding & Coherence Times',
    points: [
      'Physical-to-logical error suppression scaling by 10x per code distance increment',
      'Cryogenic dilution refrigerator operation stabilized at 15 millikelvin',
      'Universal fault-tolerant Clifford + T gate synthesis verification pipeline',
      'Hybrid quantum-classical optimization algorithm benchmarks against supercomputers'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    aspectRatio: '1:1',
    model: 'gpt-image-2',
    styleName: 'Isometric 3D Cutaway',
    category: '3D & Spatial',
    layout: 'centered',
    engraved: true,
  },
  {
    id: 'zen-showcase-03',
    timestamp: Date.now() - 1000 * 60 * 60 * 36, // 36 hours ago
    title: 'Global Supply Chain Neural Optimization Map',
    topic: 'Multimodal Freight, Dynamic Routing & Carbon Minimization',
    points: [
      '31% reduction in maritime transit deadhead kilometers via dynamic repositioning',
      'Automated customs classification reducing port dwelling bottlenecks by 48 hours',
      'End-to-end cold chain telematics tracking temperature variances under ±0.2°C',
      'Multi-echelon inventory buffering mitigating geopolitical disruption spikes'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    aspectRatio: '16:9',
    model: 'gpt-image-2',
    styleName: 'Corporate Annual Report',
    category: 'Corporate',
    layout: 'asymmetrical',
    engraved: true,
  }
];

export const historyService = {
  /**
   * Retrieves all history items sorted by newest first
   */
  async getHistory(): Promise<HistoryItem[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          const items: HistoryItem[] = request.result || [];
          if (items.length === 0) {
            // Check fallback
            const fallback = getFromLocalStorage();
            if (fallback.length > 0) {
              resolve(fallback.sort((a, b) => b.timestamp - a.timestamp));
              return;
            }
            // Seed initial showcase items
            resolve(SEED_HISTORY_ITEMS);
            // Non-blocking background save of seeds to DB
            SEED_HISTORY_ITEMS.forEach(seed => historyService.saveItem(seed).catch(() => {}));
            return;
          }
          items.sort((a, b) => b.timestamp - a.timestamp);
          resolve(items);
        };
        request.onerror = () => {
          resolve(getFromLocalStorage());
        };
      });
    } catch {
      const fallback = getFromLocalStorage();
      return fallback.length > 0 ? fallback : SEED_HISTORY_ITEMS;
    }
  },

  /**
   * Saves a new generated infographic into history
   */
  async saveItem(item: Omit<HistoryItem, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): Promise<HistoryItem> {
    const fullItem: HistoryItem = {
      ...item,
      id: item.id || `zen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: item.timestamp || Date.now(),
      engraved: item.engraved ?? true,
    };

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.put(fullItem);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB save failed, using localStorage fallback', e);
    }

    // Always mirror to localStorage
    const local = getFromLocalStorage().filter(x => x.id !== fullItem.id);
    local.unshift(fullItem);
    saveToLocalStorage(local);

    return fullItem;
  },

  /**
   * Deletes an item from history by ID
   */
  async deleteItem(id: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB delete failed', e);
    }

    const local = getFromLocalStorage().filter(x => x.id !== id);
    saveToLocalStorage(local);
  },

  /**
   * Clears all history items
   */
  async clearHistory(): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB clear failed', e);
    }
    localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY);
  }
};
