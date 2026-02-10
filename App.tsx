
import React, { useState } from 'react';
import { AppProvider, useApp } from './state';
import Layout from './components/Layout';
import HomeTab from './components/HomeTab';
import SchedulerTab from './components/SchedulerTab';
import SpacedTab from './components/SpacedTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsTab from './components/SettingsTab';
import QuoteTab from './components/QuoteTab';
import { Tab } from './types';
import PandaMascot from './components/PandaMascot';
import { MapPin, User, ArrowRight, Loader2, HardDrive, FolderOpen, ShieldAlert } from 'lucide-react';

const InitScreen: React.FC = () => {
  const { initializeProfile } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsDeploying(true);
      if ("Notification" in window) {
        Notification.requestPermission();
      }
      await initializeProfile(name, location || "Central Station");
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <FolderOpen size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Vault Setup</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Select a folder to host your base</p>
          </div>
        </div>

        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
           <p className="text-[10px] font-bold text-indigo-800 leading-relaxed uppercase text-center">
             Notice: You will pick a physical folder. All mission data will be saved as a compressed vault file there.
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Panda Alias</label>
            <div className="relative">
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your profile" 
                className="w-full bg-gray-50 p-5 rounded-2xl outline-none border border-gray-100 font-bold focus:ring-4 focus:ring-indigo-50 transition-all pl-12"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Base Location</label>
            <div className="relative">
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where is your training ground?" 
                className="w-full bg-gray-50 p-5 rounded-2xl outline-none border border-gray-100 font-bold focus:ring-4 focus:ring-indigo-50 transition-all pl-12 pr-12"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
              <button 
                type="button"
                onClick={handleLocate}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} fill="currentColor" opacity={0.2} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isDeploying}
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all group disabled:opacity-50"
          >
            {isDeploying ? <Loader2 className="animate-spin" size={18} /> : <>PICK FOLDER & START <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

const PermissionScreen: React.FC = () => {
  const { requestFileSystemPermission, userName } = useApp();
  return (
    <div className="fixed inset-0 z-[500] bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 text-center animate-in fade-in zoom-in">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-[2rem] flex items-center justify-center mx-auto">
          <ShieldAlert size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800">Permission Required</h2>
          <p className="text-sm font-bold text-gray-400 uppercase mt-2">Welcome back, {userName}</p>
        </div>
        <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase">
          Browser security requires you to manually re-grant permission to access your Mission Vault folder for this session.
        </p>
        <button 
          onClick={requestFileSystemPermission}
          className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl active:scale-95 transition-all"
        >
          RE-CONNECT TO BASE
        </button>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab, isInitialized, needsPermission } = useApp();

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
      <div className="pb-24 pt-4 px-4 h-full overflow-y-auto no-scrollbar">
        {renderTab()}
      </div>
      {(activeTab === Tab.HOME || activeTab === Tab.SETTINGS || activeTab === Tab.SENSEI) && <PandaMascot size="small" />}
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
