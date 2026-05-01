import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import HolographicDashboard from './components/dashboard/HolographicDashboard';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import { useUIStore, useSystemStore } from './store';

function App() {
  const { activeView } = useUIStore();
  const { fetchStats } = useSystemStore();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      <TitleBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Canvas
              camera={{ position: [0, 0, 15], fov: 50 }}
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={null}>
                <HolographicDashboard />
              </Suspense>
            </Canvas>
          </div>
          
          <div className="relative z-10 h-full">
            {activeView === 'dashboard' && (
              <div className="h-full p-6 overflow-auto">
                <DashboardContent />
              </div>
            )}
            
            {activeView === 'ai' && (
              <div className="h-full p-6 overflow-auto">
                <AIViewContent />
              </div>
            )}
            
            {activeView === 'system' && (
              <div className="h-full p-6 overflow-auto">
                <SystemViewContent />
              </div>
            )}
            
            {activeView === 'settings' && (
              <div className="h-full p-6 overflow-auto">
                <SettingsContent />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { stats } = useSystemStore();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      <div className="col-span-1 lg:col-span-2 panel">
        <h1 className="text-3xl font-display font-bold text-jarvis-cyan glow-text mb-2">
          Welcome, Sir
        </h1>
        <p className="text-gray-400">
          JARVIS is online and ready. Current time: {new Date().toLocaleTimeString()}
        </p>
      </div>
      
      <div className="panel">
        <h3 className="text-sm font-medium text-gray-400 mb-3">CPU Usage</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="rgba(0,212,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="var(--jarvis-cyan)"
                strokeWidth="8"
                strokeDasharray={`${(stats?.cpu?.usage || 0) * 2.51} 251`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              {stats?.cpu?.usage || 0}%
            </span>
          </div>
          <div className="text-sm">
            <p className="text-gray-400">Cores: {stats?.cpu?.cores || 0}</p>
            <p className="text-gray-400">Speed: {stats?.cpu?.speed || 0} MHz</p>
          </div>
        </div>
      </div>
      
      <div className="panel">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Memory</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="rgba(139,92,246,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="8"
                strokeDasharray={`${(stats?.memory?.percentage || 0) * 2.51} 251`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              {stats?.memory?.percentage || 0}%
            </span>
          </div>
          <div className="text-sm">
            <p className="text-gray-400">
              Used: {stats?.memory?.used ? Math.round(stats.memory.used / 1024 / 1024 / 1024) : 0} GB
            </p>
            <p className="text-gray-400">
              Total: {stats?.memory?.total ? Math.round(stats.memory.total / 1024 / 1024 / 1024) : 0} GB
            </p>
          </div>
        </div>
      </div>
      
      <div className="panel">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Disk</h3>
        <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
          <div
            className="bg-gradient-to-r from-jarvis-cyan to-jarvis-purple h-4 rounded-full progress-bar transition-all duration-500"
            style={{ width: `${stats?.disk?.percentage || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Used: {stats?.disk?.used ? Math.round(stats.disk.used / 1024 / 1024 / 1024) : 0} GB</span>
          <span>Free: {stats?.disk?.free ? Math.round(stats.disk.free / 1024 / 1024 / 1024) : 0} GB</span>
        </div>
      </div>
      
      <div className="panel">
        <h3 className="text-sm font-medium text-gray-400 mb-3">System Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Platform</span>
            <span className="text-jarvis-cyan">{stats?.platform || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Uptime</span>
            <span className="text-jarvis-cyan">
              {stats?.uptime ? Math.floor(stats.uptime / 3600) + 'h' : '0h'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Update</span>
            <span className="text-jarvis-cyan">
              {new Date(stats?.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="col-span-1 lg:col-span-2 panel">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-jarvis">System Scan</button>
          <button className="btn-jarvis">Memory Optimize</button>
          <button className="btn-jarvis">Network Check</button>
          <button className="btn-jarvis">AI Assistant</button>
        </div>
      </div>
    </div>
  );
}

function AIViewContent() {
  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="panel mb-4">
        <h2 className="text-2xl font-display font-bold text-jarvis-cyan glow-text mb-2">
          JARVIS AI Assistant
        </h2>
        <p className="text-gray-400">Your personal AI assistant powered by advanced language models</p>
      </div>
      
      <div className="flex-1 panel overflow-auto">
        <p className="text-gray-400 text-center py-8">AI conversation interface</p>
      </div>
    </div>
  );
}

function SystemViewContent() {
  return (
    <div className="animate-fade-in">
      <div className="panel mb-6">
        <h2 className="text-2xl font-display font-bold text-jarvis-cyan glow-text mb-2">
          System Monitor
        </h2>
        <p className="text-gray-400">Real-time system diagnostics and monitoring</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="text-lg font-medium text-jarvis-cyan mb-4">Services</h3>
          <div className="space-y-3">
            <ServiceStatus name="SystemService" status="ready" />
            <ServiceStatus name="AIOSService" status="ready" />
            <ServiceStatus name="LLMService" status="ready" />
          </div>
        </div>
        
        <div className="panel">
          <h3 className="text-lg font-medium text-jarvis-cyan mb-4">Performance</h3>
          <p className="text-gray-400">Loading performance metrics...</p>
        </div>
      </div>
    </div>
  );
}

function ServiceStatus({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
      <span className="font-mono text-sm">{name}</span>
      <div className="flex items-center gap-2">
        <span className={`status-${status === 'ready' ? 'online' : 'offline'}`} />
        <span className="text-xs text-gray-400 uppercase">{status}</span>
      </div>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="animate-fade-in">
      <div className="panel mb-6">
        <h2 className="text-2xl font-display font-bold text-jarvis-cyan glow-text mb-2">
          Settings
        </h2>
        <p className="text-gray-400">Configure JARVIS to your preferences</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="text-lg font-medium text-jarvis-cyan mb-4">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Theme</span>
              <select className="input-jarvis w-32">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="panel">
          <h3 className="text-lg font-medium text-jarvis-cyan mb-4">AI Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Temperature</span>
              <input type="range" min="0" max="100" defaultValue="70" className="w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;