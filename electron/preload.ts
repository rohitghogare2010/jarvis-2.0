import { contextBridge, ipcRenderer } from 'electron';

// Type-safe API for renderer process
export interface ElectronAPI {
  // Window controls
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
  };
  
  // Service communication
  service: {
    call: (serviceName: string, method: string, args?: unknown[]) => Promise<{ success: boolean; data?: unknown; error?: string }>;
    getStatus: (serviceName: string) => Promise<ServiceStatus | null>;
    list: () => Promise<string[]>;
    subscribe: (serviceName: string, eventName: string, callback: (data: unknown) => void) => void;
    unsubscribe: (serviceName: string, eventName: string) => void;
  };
  
  // System operations
  system: {
    getStats: () => Promise<SystemStats>;
  };
  
  // AI operations
  ai: {
    process: (input: string) => Promise<AIResponse>;
  };
  
  // LLM operations
  llm: {
    generate: (prompt: string, options?: LLMOOptions) => Promise<LLMResponse>;
  };
}

export interface ServiceStatus {
  name: string;
  status: 'initializing' | 'ready' | 'error' | 'stopped';
  uptime: number;
  lastError?: string;
}

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    upload: number;
    download: number;
  };
  platform: string;
  uptime: number;
  timestamp: number;
}

export interface AIResponse {
  text: string;
  intent: string;
  confidence: number;
  suggestions?: string[];
}

export interface LLMOOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMResponse {
  text: string;
  model: string;
  tokens: number;
  finishReason: string;
}

// Expose API to renderer
const electronAPI: ElectronAPI = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      ipcRenderer.on('window:maximizeChanged', (_event, isMaximized) => callback(isMaximized));
    },
  },
  
  service: {
    call: (serviceName, method, args) => ipcRenderer.invoke('service:call', serviceName, method, args),
    getStatus: (serviceName) => ipcRenderer.invoke('service:getStatus', serviceName),
    list: () => ipcRenderer.invoke('service:list'),
    subscribe: (serviceName, eventName, callback) => {
      ipcRenderer.on(`service:${serviceName}:${eventName}`, (_event, data) => callback(data));
    },
    unsubscribe: (serviceName, eventName) => {
      ipcRenderer.removeAllListeners(`service:${serviceName}:${eventName}`);
    },
  },
  
  system: {
    getStats: () => ipcRenderer.invoke('system:getStats'),
  },
  
  ai: {
    process: (input) => ipcRenderer.invoke('ai:process', input),
  },
  
  llm: {
    generate: (prompt, options) => ipcRenderer.invoke('llm:generate', prompt, options),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);