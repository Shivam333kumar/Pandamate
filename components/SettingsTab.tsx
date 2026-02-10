
import React, { useState, useEffect } from 'react';
import { Moon, Clock, Palette, Bell, User, Zap, Key, ExternalLink, ShieldCheck, WifiOff, Globe, FolderCheck, Database } from 'lucide-react';
import { useApp } from '../state';

const SettingsTab: React.FC = () => {
  const { sleepConfig, setSleepConfig, userName, setUserName, remindersEnabled, setRemindersEnabled, userLocation, storageType } = useApp();
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        const result = await window.aistudio.hasSelectedApiKey();
        setHasKey(result);
      } catch (e) {
        setHasKey(false);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    } catch (e) {
      alert("Error opening API selector.");
    }
  };

  return (
    <div className="tab-content h-full overflow-y-auto no-scrollbar px-4 space-y-6 pb-24">
      <div className="text-center pt-4">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">System Settings</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Vault Mode 3.0 Stable</p>
      </div>

      {/* Vault Connectivity Badge */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between ${storageType === 'FOLDER' ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
        <div className="flex items-center gap-3">
          {storageType === 'FOLDER' ? <FolderCheck size={18} className="text-indigo-500" /> : <Database size={18} className="text-orange-500" />}
          <div>
            <span className={`text-[11px] font-black uppercase tracking-widest block ${storageType === 'FOLDER' ? 'text-indigo-600' : 'text-orange-600'}`}>
              {storageType === 'FOLDER' ? 'Directory Vault Active' : 'Browser Vault Active'}
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase">
              Base: {userLocation}
            </span>
          </div>
        </div>
        <ShieldCheck size={20} className={storageType === 'FOLDER' ? 'text-green-500' : 'text-orange-500'} />
      </div>

      <div className="bg-white/40 p-6 rounded-[2.5rem] border border-white/50 shadow-sm space-y-8 transition-all">
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="font-black text-gray-700 flex items-center gap-2 text-sm">
            <User size={18} className="text-blue-500" /> User Profile
          </h3>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Identity Name</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/60 p-4 rounded-2xl border border-gray-100 font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* API Key Section */}
        <div className="space-y-4">
          <h3 className="font-black text-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Key size={18} className="text-orange-500" /> Brain Connection
            </div>
          </h3>
          <div className="bg-white/80 p-4 rounded-3xl border border-gray-100 space-y-3 shadow-inner">
            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tighter">
              Optional: Connect a paid Gemini API key to unlock personalized AI conversations with Sensei.
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleOpenKeySelector}
                className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  hasKey 
                    ? 'bg-white border-2 border-orange-200 text-orange-600' 
                    : 'bg-orange-500 text-white shadow-lg shadow-orange-100 active:scale-95'
                }`}
              >
                <Key size={14} /> {hasKey ? 'Update API Key' : 'Deploy Personal Key'}
              </button>
            </div>
          </div>
        </div>

        {/* Sleep Config */}
        <div className="space-y-4">
          <h3 className="font-black text-gray-700 flex items-center gap-2 text-sm">
            <Moon size={18} className="text-teal-500" /> Recovery Cycle
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Daily Bedtime</label>
              <input 
                type="time" 
                value={sleepConfig.bedtime}
                onChange={(e) => setSleepConfig(p => ({ ...p, bedtime: e.target.value }))}
                className="w-full bg-white/60 p-4 rounded-2xl border border-gray-100 font-bold text-gray-700 focus:ring-4 focus:ring-teal-100 transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end ml-2 mr-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Target Rest</label>
                <span className="text-xs font-black text-teal-600">{sleepConfig.duration} HOURS</span>
              </div>
              <div className="flex items-center gap-4 bg-white/60 p-2 rounded-2xl shadow-sm border border-gray-100">
                <input 
                  type="range" 
                  min="4" 
                  max="12" 
                  step="0.5"
                  value={sleepConfig.duration}
                  onChange={(e) => setSleepConfig(p => ({ ...p, duration: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="border-t border-gray-100 pt-6 space-y-3">
          <button 
            onClick={() => setRemindersEnabled(!remindersEnabled)}
            className={`w-full flex justify-between items-center p-5 rounded-[2rem] transition-all ${remindersEnabled ? 'bg-orange-50 border border-orange-100 shadow-inner' : 'bg-gray-50 border border-gray-100 hover:bg-white'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${remindersEnabled ? 'bg-orange-200 text-orange-600' : 'bg-gray-200 text-gray-400'}`}>
                <Bell size={18} className={remindersEnabled ? 'animate-ring' : ''} />
              </div>
              <div className="text-left">
                <span className={`text-sm font-black block ${remindersEnabled ? 'text-orange-700' : 'text-gray-700'}`}>Smart Alerts</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase">System Push Notifications</span>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${remindersEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${remindersEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>
      
      <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 mb-10">
         <h4 className="text-[10px] font-black text-indigo-700 mb-2 flex items-center gap-2 uppercase tracking-widest">
           <Zap size={14} /> Vault Encryption
         </h4>
         <p className="text-xs text-indigo-600/80 leading-relaxed font-bold">
           {storageType === 'FOLDER' 
             ? 'Your profile is synchronized with a physical folder on this device. Data is compressed for performance.' 
             : 'Folder access is restricted; your profile is secured in the Browser Vault. Data remains local to this device.'}
         </p>
      </div>
    </div>
  );
};

export default SettingsTab;
