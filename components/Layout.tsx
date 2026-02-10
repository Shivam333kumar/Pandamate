
import React from 'react';
import { Home, Calendar, RefreshCw, BarChart2, Settings, Flame, Star, Scroll } from 'lucide-react';
import { useApp } from '../state';
import { Tab } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, stats, userName } = useApp();

  const navItems = [
    { icon: <Home size={22} />, label: 'Home', value: Tab.HOME },
    { icon: <Calendar size={22} />, label: 'Plan', value: Tab.SCHEDULER },
    { icon: <RefreshCw size={22} />, label: 'Spaced', value: Tab.SPACED },
    { icon: <Scroll size={22} />, label: 'Sensei', value: Tab.SENSEI },
    { icon: <BarChart2 size={22} />, label: 'Stats', value: Tab.ANALYTICS },
    { icon: <Settings size={22} />, label: 'Set', value: Tab.SETTINGS },
  ];

  return (
    <div className="flex flex-row h-screen max-w-md mx-auto relative bg-transparent overflow-hidden">
      
      {/* Material 3 Vertical Navigation Rail */}
      <nav className="w-22 h-full bg-white/40 backdrop-blur-md flex flex-col items-center py-6 border-r border-gray-200/50 shadow-[4px_0_12px_rgba(0,0,0,0.02)] z-30">
        <div className="mb-8 p-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Star size={20} fill="currentColor" />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center gap-6 w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className="flex flex-col items-center justify-center w-full relative group outline-none py-2"
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-full" />
                )}
                <div className={`relative px-4 py-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[#E8DEF8] text-[#1D192B] shadow-sm' : 'text-[#49454F] group-active:bg-gray-200'}`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] mt-1 font-black uppercase tracking-tighter transition-colors ${isActive ? 'text-[#1D192B]' : 'text-[#49454F] opacity-60'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pb-4">
           <button 
            onClick={() => setActiveTab(Tab.SETTINGS)}
            className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md active:scale-90 transition-transform"
          >
            <img 
              src={`https://picsum.photos/seed/${userName}/100`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Android Top App Bar */}
        <header className="flex justify-between items-center px-6 py-4 bg-transparent z-20 shrink-0">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-[#FFDBCF]/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-[#3E0E00] font-black text-[11px] shadow-sm">
              <Flame size={14} fill="currentColor" /> {stats.streak}
            </div>
            <div className="flex items-center gap-1.5 bg-[#EADDFF]/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-[#21005D] font-black text-[11px] shadow-sm">
              <Star size={14} fill="currentColor" /> {stats.xp}
            </div>
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {activeTab}
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
