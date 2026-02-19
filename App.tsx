
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
import { User, ArrowRight, Loader2, Key, ShieldCheck, LogIn, UserPlus, AlertCircle } from 'lucide-react';

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

const AlarmOverlay: React.FC<{ alarm: Task; onTaken: () => void }> = ({ alarm, onTaken }) => (
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

const AuthScreen: React.FC = () => {
  const { login, signup } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setLoading(true);
    try {
      const success = isLogin 
        ? await login(username, remember)
        : await signup(username);
      
      if (!success) {
        setError(isLogin ? 'Vault not found' : 'Vault already exists');
      }
    } catch (err) {
      setError('Connection failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-transparent flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-sm bg-white/70 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-500 border border-white/50">
        <div className="flex flex-col items-center text-center space-y-4">
          <PandaLogo className="w-24 h-24 shadow-2xl rounded-full bg-white p-1" />
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Panda-Mate</h1>
            <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest mt-1">
              Local Vault Access
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Vault Username" 
                className="w-full bg-white/50 p-5 rounded-2xl outline-none border border-white font-bold focus:ring-4 focus:ring-emerald-100 transition-all pl-12"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={20} />
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

          <div className="flex items-center gap-3 ml-2">
            <input 
              type="checkbox" 
              id="remember" 
              checked={remember} 
              onChange={(e) => setRemember(e.target.checked)} 
              className="w-5 h-5 accent-emerald-600 rounded-lg cursor-pointer"
            />
            <label htmlFor="remember" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Stay Logged In</label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all group disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'INITIALIZE VAULT' : 'CREATE NEW VAULT'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest hover:text-emerald-700 transition-colors"
          >
            {isLogin ? "Need a new vault? Register here" : "Access existing vault? Login here"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab, isInitialized, tasks, toggleTask, currentUser } = useApp();
  const [activeAlarm, setActiveAlarm] = useState<Task | null>(null);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);
  const notifiedTasks = useRef<Set<string>>(new Set());
  const lastCheckedDay = useRef<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    alarmAudio.current = new Audio(ALARM_SOUND_URL);
    alarmAudio.current.loop = true;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];
      
      if (lastCheckedDay.current !== todayStr) {
        notifiedTasks.current.clear();
        lastCheckedDay.current = todayStr;
      }
      
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

      // CHANGE 1: Push Notifications When a New Slot Starts
      tasks.forEach(task => {
        if (task.completed) return;
        const tDate = new Date(task.startTime);
        const tDateStr = tDate.toISOString().split('T')[0];
        
        if (tDateStr === todayStr && tDate.getHours() === currentHours && tDate.getMinutes() === currentMinutes) {
          if (!notifiedTasks.current.has(task.id)) {
            const showNotification = (title: string, options: NotificationOptions) => {
              if (Notification.permission === "granted") {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                  });
                } else {
                  new Notification(title, options);
                }
              }
            };

            showNotification(`${task.name} started`, {
              body: `Your scheduled task "${task.name}" has begun.`,
              icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
              tag: `task-start-${task.id}`,
            });
            notifiedTasks.current.add(task.id);
          }
        }
      });
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

  if (!currentUser || !isInitialized) return <AuthScreen />;

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
