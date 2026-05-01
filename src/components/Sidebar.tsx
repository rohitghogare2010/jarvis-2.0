import { useUIStore, useServiceStore } from '../store';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'ai', label: 'AI Assistant', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'system', label: 'System', icon: 'M5 12h14M12 5l7 7-7 7' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

export default function Sidebar() {
  const { sidebarOpen, activeView, setActiveView, toggleSidebar } = useUIStore();
  const { services } = useServiceStore();

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-12 left-2 z-50 p-2 rounded-lg bg-black/50 border border-jarvis-cyan/20 hover:border-jarvis-cyan/40 transition-all no-drag"
      >
        <svg 
          className={`w-5 h-5 text-jarvis-cyan transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-8 left-0 h-full glass-dark z-40 transition-all duration-300 no-drag ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo Section */}
          <div className="flex items-center gap-3 pb-6 border-b border-jarvis-cyan/10">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-jarvis-cyan/20 to-jarvis-purple/20 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-jarvis-cyan">JARVIS</h2>
              <p className="text-xs text-gray-500">AI Operating System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id as typeof activeView)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeView === item.id
                        ? 'bg-jarvis-cyan/10 text-jarvis-cyan border border-jarvis-cyan/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-jarvis-cyan'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                    <span className="font-medium">{item.label}</span>
                    {activeView === item.id && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-jarvis-cyan" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services Status */}
          <div className="pt-4 border-t border-jarvis-cyan/10">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Services
            </h3>
            <div className="space-y-2">
              {services.length > 0 ? (
                services.slice(0, 3).map((service) => (
                  <div key={service.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{service.name}</span>
                    <span className={`status-${service.status === 'ready' ? 'online' : 'warning'}`} />
                  </div>
                ))
              ) : (
                <>
                  <ServiceItem name="SystemService" status="online" />
                  <ServiceItem name="AIOSService" status="online" />
                  <ServiceItem name="LLMService" status="online" />
                </>
              )}
            </div>
          </div>

          {/* Version */}
          <div className="pt-4 text-center">
            <span className="text-xs text-gray-600">v1.0.0 • Build 2024</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function ServiceItem({ name, status }: { name: string; status: 'online' | 'warning' }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-400 font-mono text-xs">{name}</span>
      <span className={`status-${status}`} />
    </div>
  );
}