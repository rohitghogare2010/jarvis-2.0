import { BaseService, ServiceConfig } from './BaseService';

export class ServiceManager {
  private services: Map<string, BaseService> = new Map();
  private serviceConfigs: Map<string, ServiceConfig> = new Map();

  registerService(service: BaseService, config?: Partial<ServiceConfig>): void {
    const name = service.getName();
    
    if (this.services.has(name)) {
      console.warn(`[ServiceManager] Service ${name} already registered, skipping...`);
      return;
    }

    this.services.set(name, service);
    
    const mergedConfig: ServiceConfig = {
      name,
      enabled: true,
      autoStart: true,
      ...config,
    };
    this.serviceConfigs.set(name, mergedConfig);

    // Set up event forwarding
    service.on('error', (error: string) => {
      console.error(`[ServiceManager] ${name} error:`, error);
    });

    service.on('statusChanged', (status: string) => {
      console.log(`[ServiceManager] ${name} status: ${status}`);
    });

    console.log(`[ServiceManager] Registered service: ${name}`);
  }

  async initialize(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    for (const [name, service] of this.services) {
      const config = this.serviceConfigs.get(name);
      
      if (!config?.enabled) {
        console.log(`[ServiceManager] Skipping disabled service: ${name}`);
        continue;
      }

      if (config.autoStart) {
        initPromises.push(this.startService(name));
      }
    }

    await Promise.allSettled(initPromises);
    
    const readyCount = Array.from(this.services.values())
      .filter(s => s.getStatus().status === 'ready')
      .length;
    
    console.log(`[ServiceManager] Initialized ${readyCount}/${this.services.size} services`);
  }

  async startService(name: string): Promise<void> {
    const service = this.services.get(name);
    
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    try {
      console.log(`[ServiceManager] Starting ${name}...`);
      await service.initialize();
      console.log(`[ServiceManager] ${name} started successfully`);
    } catch (error) {
      console.error(`[ServiceManager] Failed to start ${name}:`, error);
      throw error;
    }
  }

  async stopService(name: string): Promise<void> {
    const service = this.services.get(name);
    
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    try {
      console.log(`[ServiceManager] Stopping ${name}...`);
      await service.shutdown();
      console.log(`[ServiceManager] ${name} stopped successfully`);
    } catch (error) {
      console.error(`[ServiceManager] Error stopping ${name}:`, error);
    }
  }

  getService(name: string): BaseService | undefined {
    return this.services.get(name);
  }

  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  getServiceStatuses(): Array<{ name: string; status: string; uptime: number; lastError?: string }> {
    return Array.from(this.services.values()).map(service => service.getStatus());
  }

  async shutdown(): Promise<void> {
    console.log('[ServiceManager] Shutting down all services...');
    
    const shutdownPromises = Array.from(this.services.values()).map(service =>
      service.shutdown().catch(error => {
        console.error(`[ServiceManager] Error shutting down ${service.getName()}:`, error);
      })
    );

    await Promise.allSettled(shutdownPromises);
    
    this.services.clear();
    this.serviceConfigs.clear();
    
    console.log('[ServiceManager] All services shut down');
  }
}