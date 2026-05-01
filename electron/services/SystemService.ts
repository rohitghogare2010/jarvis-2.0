import os from 'os';
import { BaseService } from './BaseService';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CPUInfo {
  usage: number;
  cores: number;
  speed: number;
}

interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

interface NetworkInfo {
  upload: number;
  download: number;
}

export class SystemService extends BaseService {
  private previousCPUInfo: { idle: number; total: number } | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private currentStats: {
    cpu: CPUInfo;
    memory: MemoryInfo;
    disk: DiskInfo;
    network: NetworkInfo;
    platform: string;
    uptime: number;
    timestamp: number;
  } | null = null;

  constructor() {
    super({ name: 'SystemService' });
  }

  async initialize(): Promise<void> {
    console.log('[SystemService] Initializing...');
    
    try {
      // Initial CPU measurement
      await this.measureCPU();
      
      // Start stats collection interval
      this.statsInterval = setInterval(() => {
        this.collectStats();
      }, 1000);

      this.markReady();
      console.log('[SystemService] Initialized successfully');
    } catch (error) {
      this.setError(`Initialization failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log('[SystemService] Shutting down...');
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    this.setStatus('stopped');
    console.log('[SystemService] Shut down successfully');
  }

  async execute(method: string, args?: unknown[]): Promise<unknown> {
    switch (method) {
      case 'getStats':
        return this.getStats();
      case 'getCPUInfo':
        return this.getCPUInfo();
      case 'getMemoryInfo':
        return this.getMemoryInfo();
      case 'getDiskInfo':
        return this.getDiskInfo();
      case 'getNetworkInfo':
        return this.getNetworkInfo();
      case 'executeCommand':
        return this.executeCommand(args?.[0] as string);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  async getStats(): Promise<{
    cpu: CPUInfo;
    memory: MemoryInfo;
    disk: DiskInfo;
    network: NetworkInfo;
    platform: string;
    uptime: number;
    timestamp: number;
  }> {
    const [cpu, memory, disk] = await Promise.all([
      this.getCPUInfo(),
      this.getMemoryInfo(),
      this.getDiskInfo(),
    ]);

    const network = this.getNetworkInfo();

    return {
      cpu,
      memory,
      disk,
      network,
      platform: os.platform(),
      uptime: os.uptime(),
      timestamp: Date.now(),
    };
  }

  private async measureCPU(): Promise<CPUInfo> {
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const cpuSpeed = cpus[0]?.speed || 0;

    // Simple CPU usage calculation
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const currentInfo = { idle: totalIdle, total: totalTick };

    if (this.previousCPUInfo) {
      const idleDiff = currentInfo.idle - this.previousCPUInfo.idle;
      const totalDiff = currentInfo.total - this.previousCPUInfo.total;
      const usage = totalDiff > 0 ? Math.round((1 - idleDiff / totalDiff) * 100) : 0;

      this.previousCPUInfo = currentInfo;

      return {
        usage: Math.min(100, Math.max(0, usage)),
        cores: cpuCount,
        speed: cpuSpeed,
      };
    }

    this.previousCPUInfo = currentInfo;

    return {
      usage: 0,
      cores: cpuCount,
      speed: cpuSpeed,
    };
  }

  private async getCPUInfo(): Promise<CPUInfo> {
    return this.measureCPU();
  }

  private getMemoryInfo(): MemoryInfo {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.round((used / total) * 100);

    return {
      total,
      used,
      free,
      percentage,
    };
  }

  private async getDiskInfo(): Promise<DiskInfo> {
    try {
      const platform = os.platform();
      
      if (platform === 'win32') {
        const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
        const lines = stdout.trim().split('\n').filter(l => l.trim());
        
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/);
          if (parts.length >= 2) {
            const freeSpace = parseInt(parts[0], 10) || 0;
            const size = parseInt(parts[1], 10) || freeSpace * 2;
            const used = size - freeSpace;
            
            return {
              total: size,
              used,
              free: freeSpace,
              percentage: Math.round((used / size) * 100),
            };
          }
        }
      } else {
        const { stdout } = await execAsync('df -k / | tail -1');
        const parts = stdout.trim().split(/\s+/);
        
        if (parts.length >= 4) {
          const total = parseInt(parts[1], 10) * 1024;
          const used = parseInt(parts[2], 10) * 1024;
          const free = parseInt(parts[3], 10) * 1024;
          
          return {
            total,
            used,
            free,
            percentage: Math.round((used / total) * 100),
          };
        }
      }
    } catch (error) {
      console.warn('[SystemService] Failed to get disk info:', error);
    }

    // Fallback
    return {
      total: 500000000000,
      used: 250000000000,
      free: 250000000000,
      percentage: 50,
    };
  }

  private getNetworkInfo(): NetworkInfo {
    // Basic network stats - would need platform-specific implementation
    return {
      upload: 0,
      download: 0,
    };
  }

  private async collectStats(): Promise<void> {
    try {
      this.currentStats = await this.getStats();
      this.emit('statsUpdate', this.currentStats);
    } catch (error) {
      console.error('[SystemService] Stats collection error:', error);
    }
  }

  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
      return { stdout, stderr };
    } catch (error) {
      return { stdout: '', stderr: (error as Error).message };
    }
  }
}