
import React from 'react';
import { Home, Calendar, RefreshCw, BarChart2, Settings, Flame, Star, Scroll, GraduationCap } from 'lucide-react';
import { useApp } from '../state';
import { Tab } from '../types';

const PandaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#1C1B1F" strokeWidth="2" />
    <circle cx="28" cy="28" r="14" fill="#1C1B1F" />
    <circle cx="72" cy="28" r="14" fill="#1C1B1F" />
    <circle cx="50" cy="58" r="32" fill="#FFFFFF" stroke="#1C1B1F" strokeWidth="2" />
    <circle cx="38" cy="52" r="10" fill="#1C1B1F" />
    <circle cx="62" cy="52" r="10" fill="#1C1B1F" />
    <circle cx="38" cy="50" r="3" fill="#FFFFFF" />
    <circle cx="62" cy="50" r="3" fill="#FFFFFF" />
    <path d="M 44,68 Q 50,75 56,68" fill="none" stroke="#1C1B1F" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="50" cy="64" rx="5" ry="4" fill="#1C1B1F" />
  </svg>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, stats, userName } = useApp();

  const navItems = [
    { icon: <Home size={22} />, label: 'Home', value: Tab.HOME },
    { icon: <Calendar size={22} />, label: 'Plan', value: Tab.SCHEDULER },
    { icon: <GraduationCap size={22} />, label: 'Exam', value: Tab.EXAM },
    { icon: <RefreshCw size={22} />, label: 'Spaced', value: Tab.SPACED },
    { icon: <Scroll size={22} />, label: 'Sensei', value: Tab.SENSEI },
    { icon: <BarChart2 size={22} />, label: 'Stats', value: Tab.ANALYTICS },
    { icon: <Settings size={22} />, label: 'Set', value: Tab.SETTINGS },
  ];

  return (
    <div className="flex flex-col sm:flex-row h-screen w-full max-w-[1440px] mx-auto bg-transparent overflow-hidden relative">
      
      {/* --- DESKTOP: Vertical Navigation Rail --- */}
      <nav className="hidden sm:flex w-20 lg:w-24 shrink-0 h-full bg-white/20 backdrop-blur-2xl flex-col items-center py-8 border-r border-white/20 z-30">
        <div className="mb-10 group cursor-pointer" onClick={() => setActiveTab(Tab.HOME)}>
          <PandaLogo className="w-12 h-12 shadow-xl rounded-full transition-transform group-hover:scale-110" />
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-6 w-full px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className="flex flex-col items-center justify-center w-full group outline-none py-1 relative"
              >
                <div className={`relative px-4 py-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                  isActive ? 'bg-emerald-100 text-emerald-900 shadow-sm' : 'text-gray-600 hover:bg-white/40'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] mt-1 font-black uppercase tracking-tighter transition-all duration-300 ${
                  isActive ? 'text-emerald-900' : 'text-gray-500 opacity-40 group-hover:opacity-100'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto">
           <button 
            onClick={() => setActiveTab(Tab.SETTINGS)}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-105 active:scale-95 transition-all ring-2 ring-emerald-50"
          >
            <img 
              src={`https://picsum.photos/seed/${userName}/100`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative h-full">
        {/* Top App Bar */}
        <header className="flex justify-between items-center px-6 py-4 shrink-0 z-20 sm:px-10 sm:py-6">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-orange-100/80 backdrop-blur-md px-4 py-2 rounded-full text-orange-900 font-black text-[11px] shadow-sm border border-orange-200/50">
              <Flame size={16} fill="currentColor" /> {stats.streak}
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-100/80 backdrop-blur-md px-4 py-2 rounded-full text-emerald-900 font-black text-[11px] shadow-sm border border-emerald-200/50">
              <Star size={16} fill="currentColor" /> {stats.xp}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.4em] hidden md:block">
               {activeTab} Module
             </div>
             <div className="sm:hidden">
               <PandaLogo className="w-8 h-8 shadow-md rounded-full" />
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden relative pb-24 sm:pb-0">
          <div className="h-full w-full max-w-4xl mx-auto px-4 sm:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* --- MOBILE: Bottom Navigation Bar --- */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/40 backdrop-blur-2xl border-t border-white/20 flex items-center overflow-x-auto no-scrollbar px-4 z-50">
        <div className="flex items-center justify-between min-w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className="flex flex-col items-center justify-center min-w-[64px] h-full gap-1 transition-all"
              >
                <div className={`relative px-5 py-1.5 rounded-2xl transition-all duration-300 ${
                  isActive ? 'bg-emerald-100 text-emerald-900 shadow-sm' : 'text-gray-600'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${
                  isActive ? 'text-emerald-900' : 'text-gray-500 opacity-60'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
