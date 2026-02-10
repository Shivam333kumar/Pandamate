
import React from 'react';
import { Home, Calendar, RefreshCw, BarChart2, Settings, Flame, Star, Scroll, User } from 'lucide-react';
import { useApp } from '../state';
import { Tab } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, stats, userName } = useApp();

  const navItems = [
    { icon: <Home size={24} />, label: 'Home', value: Tab.HOME },
    { icon: <Calendar size={24} />, label: 'Plan', value: Tab.SCHEDULER },
    { icon: <RefreshCw size={24} />, label: 'Spaced', value: Tab.SPACED },
    { icon: <Scroll size={24} />, label: 'Sensei', value: Tab.SENSEI },
    { icon: <BarChart2 size={24} />, label: 'Stats', value: Tab.ANALYTICS },
    { icon: <Settings size={24} />, label: 'Set', value: Tab.SETTINGS },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-transparent overflow-hidden">
      {/* Android Top App Bar */}
      <header className="flex justify-between items-center px-4 py-3 bg-transparent z-20">
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-[#FFDBCF]/80 backdrop-blur-sm px-3 py-1 rounded-full text-[#3E0E00] font-black text-[11px] shadow-sm">
            <Flame size={14} fill="currentColor" /> {stats.streak}
          </div>
          <div className="flex items-center gap-1.5 bg-[#EADDFF]/80 backdrop-blur-sm px-3 py-1 rounded-full text-[#21005D] font-black text-[11px] shadow-sm">
            <Star size={14} fill="currentColor" /> {stats.xp}
          </div>
        </div>
        <button 
          onClick={() => setActiveTab(Tab.SETTINGS)}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm active:scale-90 transition-transform"
        >
          <img 
            src={`https://picsum.photos/seed/${userName}/100`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </button>
      </header>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Material 3 Bottom Navigation Bar */}
      <nav className="h-20 bg-white/40 backdrop-blur-md flex justify-around items-center px-2 pb-safe border-t border-gray-200/50 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className="flex flex-col items-center justify-center flex-1 h-full relative group outline-none"
            >
              <div className={`relative px-5 py-1 rounded-full transition-all duration-300 ${isActive ? 'bg-[#E8DEF8] text-[#1D192B]' : 'text-[#49454F] group-active:bg-gray-200'}`}>
                {item.icon}
              </div>
              <span className={`text-[11px] mt-1 font-medium tracking-wide transition-colors ${isActive ? 'text-[#1D192B] font-bold' : 'text-[#49454F]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
