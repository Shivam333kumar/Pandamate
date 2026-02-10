
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
    <div className="flex flex-row h-screen w-full max-w-[1600px] mx-auto bg-white overflow-hidden shadow-2xl relative">
      
      {/* Material 3 Vertical Navigation Rail */}
      <nav className="w-16 sm:w-20 lg:w-24 shrink-0 h-full bg-[#F3F4F9] flex flex-col items-center py-6 border-r border-gray-200/60 z-30 transition-all duration-300">
        {/* App Logo */}
        <div className="mb-10">
          <div 
            onClick={() => setActiveTab(Tab.HOME)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Star size={20} fill="currentColor" />
          </div>
        </div>
        
        {/* Nav Items Container */}
        <div className="flex-1 flex flex-col items-center gap-4 w-full px-1 sm:px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className="flex flex-col items-center justify-center w-full group outline-none py-1 relative"
                aria-label={item.label}
              >
                {/* Active Pill Background */}
                <div className={`relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                  isActive 
                    ? 'bg-[#E8DEF8] text-[#1D192B] scale-105' 
                    : 'text-[#49454F] hover:bg-gray-200/50'
                }`}>
                  {item.icon}
                </div>
                
                {/* Label (Hidden on ultra-small height or width if needed, but keeping for UX) */}
                <span className={`text-[8px] sm:text-[9px] mt-1 font-black uppercase tracking-tighter transition-all duration-300 text-center px-1 ${
                  isActive ? 'text-[#1D192B] opacity-100' : 'text-[#49454F] opacity-40 group-hover:opacity-100'
                }`}>
                  {item.label}
                </span>

                {/* Left Active Bar Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full shadow-[2px_0_8px_rgba(79,70,229,0.3)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Profile Action */}
        <div className="mt-auto pb-6">
           <button 
            onClick={() => setActiveTab(Tab.SETTINGS)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-md active:scale-90 transition-transform ring-2 ring-gray-100"
          >
            <img 
              src={`https://picsum.photos/seed/${userName}/100`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </nav>

      {/* Content Side Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FBFBFF] relative h-full">
        {/* Top Status Bar */}
        <header className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-5 shrink-0 z-20">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-[#FFDBCF] px-3 py-1.5 rounded-full text-[#3E0E00] font-black text-[10px] sm:text-[11px] shadow-sm border border-[#FFB4A1]">
              <Flame size={14} fill="currentColor" /> {stats.streak}
            </div>
            <div className="flex items-center gap-1.5 bg-[#EADDFF] px-3 py-1.5 rounded-full text-[#21005D] font-black text-[10px] sm:text-[11px] shadow-sm border border-[#D0BCFF]">
              <Star size={14} fill="currentColor" /> {stats.xp}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] hidden sm:block">
               {activeTab} Mode
             </div>
             <div className="h-1 w-8 sm:w-12 bg-gray-100 rounded-full" />
          </div>
        </header>

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 overflow-hidden relative">
          <div className="h-full w-full max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
