import { useState, useEffect } from 'react';
import { useUIStore } from '../store';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const setWindowMaximized = useUIStore((state) => state.setWindowMaximized);

  useEffect(() => {
    // Check initial state
    window.electronAPI.window.isMaximized().then(setIsMaximized);
    
    // Listen for changes
    window.electronAPI.window.onMaximizeChange(setIsMaximized);
  }, []);

  const handleMinimize = () => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI.window.maximize();
    const maximized = await window.electronAPI.window.isMaximized();
    setIsMaximized(maximized);
    setWindowMaximized(maximized);
  };

  const handleClose = () => {
    window.electronAPI.window.close();
  };

  return (
    <div className="h-8 flex items-center justify-between bg-black/50 border-b border-jarvis-cyan/20 drag-region select-none">
      {/* App Icon and Title */}
      <div className="flex items-center gap-2 px-4">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-jarvis-cyan to-jarvis-purple animate-pulse" />
        <span className="text-sm font-display font-semibold text-jarvis-cyan tracking-wider">
          JARVIS AI OS
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center no-drag">
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-12 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v2m0 8v2a2 2 0 002 2h2m8 0h2a2 2 0 002-2v-2m0-8V6a2 2 0 00-2-2h-2" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500/80 transition-colors group"
          title="Close"
        >
          <svg className="w-3 h-3 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}