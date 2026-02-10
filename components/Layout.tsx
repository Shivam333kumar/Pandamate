
import React from 'react';
import { Home, Calendar, RefreshCw, BarChart2, Settings, Flame, Star, Scroll } from 'lucide-react';
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
    <div className="flex flex-row h-screen w-full max-w-5xl mx-auto bg-transparent overflow-hidden shadow-2xl border-x border-gray-100/20">
      
      {/* Material 3 Vertical Navigation Rail */}
      <nav className="w-20 sm:w-24 shrink-0 h-full bg-white/60 backdrop-blur-xl flex flex-col items-center py-8 border-r border-gray-200/40 z-30 transition-all duration-300">
        {/* App Logo/Icon */}
        <div className="mb-12">
          <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200/50 hover:scale-105 transition-transform cursor-pointer" onClick={() => setActiveTab(Tab.HOME)}>
            <Star size={24} fill="currentColor" />
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 flex flex-col items-center gap-4 w-full px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className="flex flex-col items-center justify-center w-full group outline-none py-2 relative"
                aria-label={item.label}
              >
                {/* Active Indicator Background */}
                <div className={`relative px-5 py-2.5 rounded-3xl transition-all duration-400 ease-out flex items-center justify-center ${
                  isActive 
                    ? 'bg-indigo-100 text-indigo-900 scale-110' 
                    : 'text-gray-500 hover:bg-gray-100/50'
                }`}>
                  {item.icon}
                </div>
                
                {/* Label */}
                <span className={`text-[9px] mt-2 font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive ? 'text-indigo-900 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'
                }`}>
                  {item.label}
                </span>
                
                {/* Visual Active Dot */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-600 rounded-l-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile / Bottom Action */}
        <div className="mt-auto pt-6 flex flex-col items-center gap-4">
           <button 
            onClick={() => setActiveTab(Tab.SETTINGS)}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg active:scale-90 transition-transform ring-4 ring-gray-50"
          >
            <img 
              src={`https://picsum.photos/seed/${userName}/100`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>
          <div className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">v3.0</div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/10 relative">
        {/* Global Status Bar (Top App Bar Style) */}
        <header className="flex justify-between items-center px-8 py-5 bg-transparent z-20 shrink-0 border-b border-gray-100/10">
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-orange-50/90 backdrop-blur-md px-4 py-2 rounded-2xl text-orange-700 font-black text-[11px] shadow-sm border border-orange-100/50">
              <Flame size={16} fill="currentColor" className="animate-pulse" /> {stats.streak}
            </div>
            <div className="flex items-center gap-2 bg-indigo-50/90 backdrop-blur-md px-4 py-2 rounded-2xl text-indigo-700 font-black text-[11px] shadow-sm border border-indigo-100/50">
              <Star size={16} fill="currentColor" /> {stats.xp}
            </div>
          </div>
          
          <div className="hidden sm:block">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] pr-4">
              Panda Mate <span className="text-indigo-300">•</span> {activeTab}
            </h2>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
