import { EventEmitter } from 'events';
import { basename } from 'path';

export interface ServiceConfig {
  name: string;
  enabled: boolean;
  autoStart: boolean;
}

export abstract class BaseService extends EventEmitter {
  protected config: ServiceConfig;
  protected status: 'initializing' | 'ready' | 'error' | 'stopped' = 'initializing';
  protected startTime: number = 0;
  protected lastError: string | undefined;

  constructor(config: Partial<ServiceConfig> = {}) {
    super();
    this.config = {
      name: basename(Object.getPrototypeOf(this).constructor.name),
      enabled: true,
      autoStart: true,
      ...config,
    };
  }

  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract execute(method: string, args?: unknown[]): Promise<unknown>;

  getName(): string {
    return this.config.name;
  }

  getStatus(): { name: string; status: string; uptime: number; lastError?: string } {
    return {
      name: this.config.name,
      status: this.status,
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      lastError: this.lastError,
    };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  protected setStatus(status: 'initializing' | 'ready' | 'error' | 'stopped'): void {
    this.status = status;
    this.emit('statusChanged', status);
  }

  protected setError(error: string): void {
    this.lastError = error;
    this.setStatus('error');
    this.emit('error', error);
  }

  protected markReady(): void {
    this.startTime = Date.now();
    this.setStatus('ready');
    this.emit('ready');
  }
}