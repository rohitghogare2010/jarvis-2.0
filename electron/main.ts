import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ServiceManager } from './services/ServiceManager';
import { SystemService } from './services/SystemService';
import { AIOSService } from './services/AIOSService';
import { LLMService } from './services/LLMService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let serviceManager: ServiceManager;

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0a0f',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initializeServices() {
  serviceManager = new ServiceManager();
  
  // Register core services
  serviceManager.registerService(new SystemService());
  serviceManager.registerService(new AIOSService());
  serviceManager.registerService(new LLMService());
  
  // Initialize all services
  serviceManager.initialize();
  
  console.log('[JARVIS] Services initialized:', serviceManager.getServiceNames());
}

function setupIPC() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Service communication
  ipcMain.handle('service:call', async (_event, serviceName: string, method: string, args?: unknown[]) => {
    try {
      const service = serviceManager.getService(serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }
      const result = await service.execute(method, args);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('service:getStatus', async (_event, serviceName: string) => {
    const service = serviceManager.getService(serviceName);
    return service?.getStatus() ?? null;
  });

  ipcMain.handle('service:list', () => {
    return serviceManager.getServiceNames();
  });

  // System stats
  ipcMain.handle('system:getStats', async () => {
    const systemService = serviceManager.getService('SystemService') as SystemService;
    return systemService?.getStats() ?? null;
  });

  // AI interaction
  ipcMain.handle('ai:process', async (_event, input: string) => {
    const aiService = serviceManager.getService('AIOSService');
    return aiService ? await aiService.execute('process', [input]) : null;
  });

  // LLM interactions
  ipcMain.handle('llm:generate', async (_event, prompt: string, options?: Record<string, unknown>) => {
    const llmService = serviceManager.getService('LLMService');
    return llmService ? await llmService.execute('generate', [prompt, options]) : null;
  });

  // Subscribe to service events
  ipcMain.on('service:subscribe', (event, serviceName: string, eventName: string) => {
    const service = serviceManager.getService(serviceName);
    if (service) {
      service.on(eventName, (data: unknown) => {
        event.sender.send(`service:${serviceName}:${eventName}`, data);
      });
    }
  });
}

app.whenReady().then(() => {
  console.log('[JARVIS] Initializing AI Operating System...');
  initializeServices();
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    serviceManager?.shutdown();
    app.quit();
  }
});

app.on('before-quit', () => {
  serviceManager?.shutdown();
});