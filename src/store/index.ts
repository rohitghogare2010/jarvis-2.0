import { create } from 'zustand';

interface SystemStats {
  cpu: { usage: number; cores: number; speed: number };
  memory: { total: number; used: number; free: number; percentage: number };
  disk: { total: number; used: number; free: number; percentage: number };
  network: { upload: number; download: number };
  platform: string;
  uptime: number;
  timestamp: number;
}

interface ServiceStatus {
  name: string;
  status: 'initializing' | 'ready' | 'error' | 'stopped';
  uptime: number;
  lastError?: string;
}

interface AIResponse {
  text: string;
  intent: string;
  confidence: number;
  suggestions?: string[];
}

interface SystemState {
  stats: SystemStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface ServiceState {
  services: ServiceStatus[];
  isLoading: boolean;
}

interface AIState {
  conversation: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  isProcessing: boolean;
  lastResponse: AIResponse | null;
}

interface UIState {
  sidebarOpen: boolean;
  activeView: 'dashboard' | 'ai' | 'system' | 'settings';
  theme: 'dark' | 'light';
  windowMaximized: boolean;
}

interface SystemStore extends SystemState {
  fetchStats: () => Promise<void>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await window.electronAPI.system.getStats();
      set({ stats, isLoading: false, lastUpdated: Date.now() });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  startPolling: (interval = 2000) => {
    const { fetchStats } = get();
    fetchStats();
    setInterval(fetchStats, interval);
  },
  
  stopPolling: () => {
    // Implementation would clear interval
  },
}));

interface ServiceStore extends ServiceState {
  fetchServices: () => Promise<void>;
}

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],
  isLoading: false,
  
  fetchServices: async () => {
    set({ isLoading: true });
    try {
      const serviceNames = await window.electronAPI.service.list();
      const statuses = await Promise.all(
        serviceNames.map(async (name: string) => {
          const status = await window.electronAPI.service.getStatus(name);
          return status;
        })
      );
      set({ services: statuses.filter(Boolean) as ServiceStatus[], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));

interface AIStore extends AIState {
  sendMessage: (message: string) => Promise<void>;
  clearHistory: () => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  conversation: [],
  isProcessing: false,
  lastResponse: null,
  
  sendMessage: async (message: string) => {
    const { conversation } = get();
    
    set({ isProcessing: true });
    
    set({
      conversation: [
        ...conversation,
        { role: 'user' as const, content: message, timestamp: Date.now() }
      ]
    });
    
    try {
      const response = await window.electronAPI.ai.process(message);
      
      set({
        conversation: [
          ...get().conversation,
          { role: 'assistant' as const, content: response.text, timestamp: Date.now() }
        ],
        lastResponse: response,
        isProcessing: false,
      });
    } catch {
      set({ isProcessing: false });
    }
  },
  
  clearHistory: () => {
    set({ conversation: [], lastResponse: null });
  },
}));

interface UIStore extends UIState {
  toggleSidebar: () => void;
  setActiveView: (view: 'dashboard' | 'ai' | 'system' | 'settings') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setWindowMaximized: (maximized: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeView: 'dashboard',
  theme: 'dark',
  windowMaximized: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => set({ theme }),
  setWindowMaximized: (maximized) => set({ windowMaximized: maximized }),
}));

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};