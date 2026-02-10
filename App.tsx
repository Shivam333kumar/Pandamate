
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppProvider, useApp } from './state';
import Layout from './components/Layout';
import HomeTab from './components/HomeTab';
import SchedulerTab from './components/SchedulerTab';
import SpacedTab from './components/SpacedTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsTab from './components/SettingsTab';
import QuoteTab from './components/QuoteTab';
import { Tab, Task } from './types';
import PandaMascot from './components/PandaMascot';
import { MapPin, User, ArrowRight, Loader2, FolderOpen, ShieldAlert, Globe, ShieldX, AlertCircle } from 'lucide-react';

const ALARM_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';

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

const AlarmOverlay: React.FC<{ alarm: Task; onTaken: () => void }> = ({ alarm, onTaken }) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-red-600 flex flex-col items-center justify-center p-8 text-white animate-pulse">
      <AlertCircle size={100} className="mb-8" />
      <h2 className="text-5xl font-black mb-4 text-center uppercase tracking-tighter">Medical Alert</h2>
      <p className="text-2xl font-bold mb-12 opacity-90 text-center">{alarm.name}</p>
      <button 
        onClick={onTaken} 
        className="w-full max-sm bg-white text-red-600 py-7 rounded-[2.5rem] font-black text-2xl shadow-2xl active:scale-95 transition-transform"
      >
        PROTOCOL: TAKEN
      </button>
    </div>
  );
};

const InitScreen: React.FC = () => {
  const { initializeProfile } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [errorType, setErrorType] = useState<'NONE' | 'RESTRICTED'>('NONE');

  const handleLocate = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`Base ${pos.coords.latitude.toFixed(2)}N, ${pos.coords.longitude.toFixed(2)}E`);
          setIsLocating(false);
        },
        () => {
          setLocation("Local Base");
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      setLocation("Local Offline Base");
    }
  };

  const handleSubmit = async (e: React.FormEvent, forceBrowser = false) => {
    e?.preventDefault();
    if (name.trim()) {
      setIsDeploying(true);
      if ("Notification" in window) {
        Notification.requestPermission();
      }
      try {
        await initializeProfile(name, location || "Central Station", forceBrowser);
      } catch (err: any) {
        if (err.message === 'BROWSER_RESTRICTED') {
          setErrorType('RESTRICTED');
        } else {
          console.error("Initialization Failed:", err);
        }
      } finally {
        setIsDeploying(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-transparent flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-sm bg-white/70 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-500 my-auto border border-white/50">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <PandaLogo className="w-24 h-24 shadow-2xl rounded-full bg-white p-1" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
              <FolderOpen size={16} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">
              Panda-Mate
            </h1>
            <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest mt-1">
              Local Vault Deployment
            </p>
          </div>
        </div>

        {errorType === 'RESTRICTED' ? (
          <div className="space-y-6">
            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4">
              <div className="flex items-center gap-3 text-emerald-600">
                <ShieldX size={20} />
                <span className="text-[11px] font-black uppercase tracking-widest">Environment Shield</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-800 leading-relaxed uppercase">
                System prevents direct folder access in this environment. 
              </p>
              <p className="text-[10px] font-medium text-emerald-700/80 leading-relaxed">
                We will use the <strong>Internal Application Vault</strong> instead. Your data stays 100% on this device.
              </p>
            </div>
            
            <button 
              onClick={(e) => handleSubmit(null as any, true)}
              className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              INITIALIZE INTERNAL VAULT <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => setErrorType('NONE')}
              className="w-full text-[10px] font-black text-emerald-600/40 uppercase tracking-widest text-center"
            >
              Try Folder Pick Again
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em] ml-2">Panda Alias</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name" 
                    className="w-full bg-white/50 p-5 rounded-2xl outline-none border border-white font-bold focus:ring-4 focus:ring-emerald-100 transition-all pl-12"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em] ml-2">Base Location</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where are you training?" 
                    className="w-full bg-white/50 p-5 rounded-2xl outline-none border border-white font-bold focus:ring-4 focus:ring-emerald-100 transition-all pl-12 pr-12"
                  />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={20} />
                  <button 
                    type="button"
                    onClick={handleLocate}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700 transition-colors"
                  >
                    {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} fill="currentColor" opacity={0.2} />}
                  </button>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                 <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase text-center">
                   Select a folder to host your Mission Vault. Data is stored locally.
                 </p>
              </div>

              <button 
                type="submit"
                disabled={isDeploying}
                className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all group disabled:opacity-50"
              >
                {isDeploying ? <Loader2 className="animate-spin" size={18} /> : <>DEPLOΥ MISSION VAULT <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const PermissionScreen: React.FC = () => {
  const { requestFileSystemPermission, userName } = useApp();
  return (
    <div className="fixed inset-0 z-[500] bg-emerald-950/20 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/70 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl space-y-8 text-center animate-in fade-in zoom-in border border-white/50">
        <div className="relative mx-auto w-24 h-24">
           <PandaLogo className="w-24 h-24 shadow-2xl rounded-full bg-white p-1" />
           <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
              <ShieldAlert size={16} />
            </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800">Connection Interrupted</h2>
          <p className="text-xs font-bold text-emerald-700/60 uppercase mt-2">Welcome back, {userName}</p>
        </div>
        <p className="text-[10px] font-bold text-emerald-900/60 leading-relaxed uppercase">
          Mission security requires you to re-grant permission to access your local Mission Vault folder.
        </p>
        <button 
          onClick={requestFileSystemPermission}
          className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl active:scale-95 transition-all shadow-emerald-100"
        >
          RE-OPEN VAULT
        </button>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab, isInitialized, needsPermission, tasks, toggleTask } = useApp();
  const [activeAlarm, setActiveAlarm] = useState<Task | null>(null);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isInitialized) return;

    alarmAudio.current = new Audio(ALARM_SOUND_URL);
    alarmAudio.current.loop = true;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];
      
      const dueMed = tasks.find(t => {
        if (!t.isMedicine || t.completed) return false;
        const tDate = new Date(t.startTime);
        const tDateStr = tDate.toISOString().split('T')[0];
        return tDateStr === todayStr && tDate.getHours() === currentHours && tDate.getMinutes() === currentMinutes;
      });

      if (dueMed && activeAlarm?.id !== dueMed.id) {
        setActiveAlarm(dueMed);
        if (Notification.permission === "granted") {
          new Notification("💊 MEDICINE REMINDER", {
            body: `Time for your ${dueMed.name}. Protocol active.`,
            icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
            tag: "medicine-alarm",
            requireInteraction: true,
          });
        }
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (alarmAudio.current) {
        alarmAudio.current.pause();
        alarmAudio.current = null;
      }
    };
  }, [isInitialized, tasks, activeAlarm]);

  useEffect(() => {
    if (activeAlarm && alarmAudio.current) {
      alarmAudio.current.play().catch(e => console.warn("Audio blocked by browser policy", e));
    } else if (!activeAlarm && alarmAudio.current) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  }, [activeAlarm]);

  const handleTaken = () => {
    if (activeAlarm) {
      toggleTask(activeAlarm.id);
      setActiveAlarm(null);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case Tab.HOME: return <HomeTab />;
      case Tab.SCHEDULER: return <SchedulerTab />;
      case Tab.SPACED: return <SpacedTab />;
      case Tab.SENSEI: return <QuoteTab />;
      case Tab.ANALYTICS: return <AnalyticsTab />;
      case Tab.SETTINGS: return <SettingsTab />;
      default: return <HomeTab />;
    }
  };

  if (needsPermission) return <PermissionScreen />;
  if (!isInitialized) return <InitScreen />;

  return (
    <Layout>
      <div className="h-full overflow-y-auto no-scrollbar pt-4">
        {renderTab()}
      </div>
      {(activeTab === Tab.HOME || activeTab === Tab.SETTINGS || activeTab === Tab.SENSEI) && <PandaMascot size="small" />}
      {activeAlarm && <AlarmOverlay alarm={activeAlarm} onTaken={handleTaken} />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
