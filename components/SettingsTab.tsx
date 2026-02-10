
import React, { useState, useEffect } from 'react';
import { Moon, Clock, Palette, Bell, User, Zap, Key, ExternalLink, ShieldCheck, WifiOff, Globe, FolderCheck, Database, RefreshCcw, FileText } from 'lucide-react';
import { useApp } from '../state';

const SettingsTab: React.FC = () => {
  const { sleepConfig, setSleepConfig, userName, setUserName, remindersEnabled, setRemindersEnabled, userLocation, storageType, vaultFiles, changeStorageFolder } = useApp();
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
        <h2 className="text-3xl font-black text-emerald-900 tracking-tight">System Settings</h2>
        <p className="text-[10px] font-bold text-emerald-700/40 uppercase tracking-[0.2em] mt-1">Vault Mode 3.0 Stable</p>
      </div>

      {/* Vault Connectivity Badge */}
      <div className={`p-6 rounded-[2.5rem] border flex flex-col gap-4 ${storageType === 'FOLDER' ? 'bg-white/40 border-white' : 'bg-emerald-50/50 border-emerald-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {storageType === 'FOLDER' ? <FolderCheck size={20} className="text-emerald-600" /> : <Database size={20} className="text-emerald-600" />}
            <div>
              <span className={`text-[11px] font-black uppercase tracking-widest block ${storageType === 'FOLDER' ? 'text-emerald-900' : 'text-emerald-900'}`}>
                {storageType === 'FOLDER' ? 'Directory Vault Active' : 'Browser Vault Active'}
              </span>
              <span className="text-[9px] font-bold text-emerald-700/40 uppercase">
                Base: {userLocation}
              </span>
            </div>
          </div>
          <ShieldCheck size={24} className="text-emerald-500" />
        </div>

        {/* Vault Explorer */}
        <div className="bg-white/40 rounded-2xl p-4 border border-white/50 space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-emerald-600" />
            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Vault Integrity</span>
          </div>
          <div className="space-y-1.5">
            {vaultFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-xl border border-white/50">
                 <span className="text-[10px] font-bold text-gray-600">{file}</span>
                 <span className="text-[8px] font-black text-emerald-500 uppercase">Synced</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={changeStorageFolder}
          className="w-full flex items-center justify-center gap-2 bg-emerald-100 text-emerald-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-colors"
        >
          <RefreshCcw size={14} /> Relocate Mission Vault
        </button>
      </div>

      <div className="bg-white/40 p-6 rounded-[2.5rem] border border-white/50 shadow-sm space-y-8 transition-all">
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="font-black text-emerald-900 flex items-center gap-2 text-sm">
            <User size={18} className="text-emerald-600" /> User Profile
          </h3>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-emerald-800/40 uppercase tracking-[0.2em] ml-2">Identity Name</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/60 p-4 rounded-2xl border border-white font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* API Key Section */}
        <div className="space-y-4">
          <h3 className="font-black text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Key size={18} className="text-orange-500" /> Brain Connection
            </div>
          </h3>
          <div className="bg-white/40 p-5 rounded-3xl border border-white space-y-4">
            <p className="text-[10px] font-bold text-emerald-900/40 leading-relaxed uppercase tracking-tighter">
              Optional: Connect a paid Gemini API key to unlock personalized AI conversations with Sensei.
            </p>
            <button 
              onClick={handleOpenKeySelector}
              className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                hasKey 
                  ? 'bg-white border border-emerald-100 text-emerald-600 shadow-sm' 
                  : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 active:scale-95'
              }`}
            >
              <Key size={14} /> {hasKey ? 'Update API Key' : 'Deploy Personal Key'}
            </button>
          </div>
        </div>

        {/* Sleep Config */}
        <div className="space-y-4">
          <h3 className="font-black text-emerald-900 flex items-center gap-2 text-sm">
            <Moon size={18} className="text-teal-600" /> Recovery Cycle
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-emerald-800/40 uppercase tracking-[0.2em] ml-2">Daily Bedtime</label>
              <input 
                type="time" 
                value={sleepConfig.bedtime}
                onChange={(e) => setSleepConfig(p => ({ ...p, bedtime: e.target.value }))}
                className="w-full bg-white/60 p-4 rounded-2xl border border-white font-bold text-gray-700 focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end ml-2 mr-2">
                <label className="text-[9px] font-black text-emerald-800/40 uppercase tracking-[0.2em]">Target Rest</label>
                <span className="text-xs font-black text-teal-600">{sleepConfig.duration} HOURS</span>
              </div>
              <div className="flex items-center gap-4 bg-white/60 p-2 rounded-2xl shadow-sm border border-white">
                <input 
                  type="range" 
                  min="4" 
                  max="12" 
                  step="0.5"
                  value={sleepConfig.duration}
                  onChange={(e) => setSleepConfig(p => ({ ...p, duration: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="border-t border-emerald-100/50 pt-6 space-y-3">
          <button 
            onClick={() => setRemindersEnabled(!remindersEnabled)}
            className={`w-full flex justify-between items-center p-5 rounded-[2rem] transition-all ${remindersEnabled ? 'bg-emerald-50/50 border border-emerald-100 shadow-inner' : 'bg-white/40 border border-white'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${remindersEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bell size={18} className={remindersEnabled ? 'animate-ring' : ''} />
              </div>
              <div className="text-left">
                <span className={`text-sm font-black block ${remindersEnabled ? 'text-emerald-900' : 'text-gray-700'}`}>Smart Alerts</span>
                <span className="text-[9px] font-bold text-emerald-700/40 uppercase">System Push Notifications</span>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${remindersEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${remindersEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>
      
      <div className="p-6 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/50 mb-10">
         <h4 className="text-[10px] font-black text-emerald-700 mb-2 flex items-center gap-2 uppercase tracking-widest">
           <Zap size={14} /> Vault Encryption
         </h4>
         <p className="text-[11px] font-bold text-emerald-800 leading-relaxed">
           {storageType === 'FOLDER' 
             ? 'Your profile is synchronized with a physical folder on this device. Data is compressed for performance.' 
             : 'Folder access is restricted; your profile is secured in the Browser Vault (IndexedDB). Data remains local to this device.'}
         </p>
      </div>
    </div>
  );
};

export default SettingsTab;
