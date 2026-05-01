import type { ElectronAPI, SystemStats, ServiceStatus, AIResponse, LLMResponse } from '../electron/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type { SystemStats, ServiceStatus, AIResponse, LLMResponse };