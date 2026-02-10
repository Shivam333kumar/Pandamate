
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, UserStats, CategoryType, PandaState, Tab, MainTask, UserAccount, UserVaultData } from './types';

interface AppContextType {
  tasks: Task[];
  addTask: (task: Partial<Task>) => void;
  addMedicineSchedule: (name: string, time: string, days: number) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  copySchedule: (sourceDate: string, targetDate: string, taskIds: string[]) => void;
  stats: UserStats;
  setMainTask: (name: string, date: string) => void;
  addXP: (amount: number) => void;
  pandaState: PandaState;
  setPandaState: (state: PandaState) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  hydration: number;
  setHydration: React.Dispatch<React.SetStateAction<number>>;
  sleepConfig: { bedtime: string; duration: number };
  setSleepConfig: React.Dispatch<React.SetStateAction<{ bedtime: string; duration: number }>>;
  userName: string;
  setUserName: (name: string) => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
  schedulerDate: Date;
  setSchedulerDate: (date: Date) => void;
  isInitialized: boolean;
  currentUser: string | null;
  login: (username: string, remember: boolean) => Promise<boolean>;
  signup: (username: string) => Promise<boolean>;
  logout: () => void;
  exportData: () => void;
  importData: (json: string) => Promise<boolean>;
  clearAllData: () => Promise<void>;
  userLocation: string;
  startDate: string;
  storageType: 'FOLDER' | 'BROWSER' | 'NONE';
  vaultFiles: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SPACED_INTERVALS = [1, 3, 7, 11];

const vaultDB = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('PandaVaultAuth', 4);
      req.onupgradeneeded = (e) => {
        const db = req.result;
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
        if (!db.objectStoreNames.contains('vaults')) db.createObjectStore('vaults', { keyPath: 'username' });
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async saveUser(user: UserAccount) {
    const db = await this.open();
    const tx = db.transaction('users', 'readwrite');
    tx.objectStore('users').put(user);
    return new Promise(resolve => tx.oncomplete = () => resolve(true));
  },
  async getUser(username: string): Promise<UserAccount | null> {
    const db = await this.open();
    const tx = db.transaction('users', 'readonly');
    const req = tx.objectStore('users').get(username);
    return new Promise(resolve => req.onsuccess = () => resolve(req.result || null));
  },
  async saveVault(username: string, data: UserVaultData) {
    const db = await this.open();
    const tx = db.transaction('vaults', 'readwrite');
    tx.objectStore('vaults').put({ username, data });
    return new Promise(resolve => tx.oncomplete = () => resolve(true));
  },
  async getVault(username: string): Promise<UserVaultData | null> {
    const db = await this.open();
    const tx = db.transaction('vaults', 'readonly');
    const req = tx.objectStore('vaults').get(username);
    return new Promise(resolve => req.onsuccess = () => resolve(req.result?.data || null));
  },
  async setSession(username: string | null) {
    const db = await this.open();
    const tx = db.transaction('sessions', 'readwrite');
    if (username) tx.objectStore('sessions').put(username, 'active_user');
    else tx.objectStore('sessions').delete('active_user');
    return new Promise(resolve => tx.oncomplete = () => resolve(true));
  },
  async getSession(): Promise<string | null> {
    const db = await this.open();
    const tx = db.transaction('sessions', 'readonly');
    const req = tx.objectStore('sessions').get('active_user');
    return new Promise(resolve => req.onsuccess = () => resolve(req.result || null));
  },
  async clearAll() {
    const db = await this.open();
    const tx = db.transaction(['users', 'vaults', 'sessions'], 'readwrite');
    tx.objectStore('users').clear();
    tx.objectStore('vaults').clear();
    tx.objectStore('sessions').clear();
    return new Promise(resolve => tx.oncomplete = () => resolve(true));
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('Central Base');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>({ streak: 0, xp: 0, hydrationCount: 0, lastHydrationUpdate: Date.now(), dailyCompletion: {} });
  const [hydration, setHydration] = useState(0);
  const [sleepConfig, setSleepConfig] = useState({ bedtime: "22:00", duration: 8 });
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [storageType, setStorageType] = useState<'FOLDER' | 'BROWSER' | 'NONE'>('NONE');
  const [vaultFiles, setVaultFiles] = useState<string[]>([]);
  const [pandaState, setPandaState] = useState<PandaState>('IDLE');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [schedulerDate, setSchedulerDate] = useState(new Date());

  const applyData = (data: UserVaultData) => {
    setUserName(data.userName || 'PandaUser');
    setUserLocation(data.userLocation || 'Unknown Base');
    setStartDate(data.startDate || new Date().toISOString().split('T')[0]);
    setTasks(data.tasks || []);
    setStats(data.stats || { streak: 0, xp: 0, hydrationCount: 0, lastHydrationUpdate: Date.now(), dailyCompletion: {} });
    setHydration(data.hydration || 0);
    setSleepConfig(data.sleepConfig || { bedtime: "22:00", duration: 8 });
    setRemindersEnabled(data.remindersEnabled !== undefined ? data.remindersEnabled : true);
  };

  const loadUserData = async (username: string) => {
    const data = await vaultDB.getVault(username);
    if (data) {
      applyData(data);
    } else {
      const defaultData: UserVaultData = {
        userName: username,
        userLocation: 'Base Alpha',
        startDate: new Date().toISOString().split('T')[0],
        tasks: [],
        stats: { streak: 0, xp: 0, hydrationCount: 0, lastHydrationUpdate: Date.now(), dailyCompletion: {} },
        hydration: 0,
        sleepConfig: { bedtime: "22:00", duration: 8 },
        remindersEnabled: true
      };
      applyData(defaultData);
      await vaultDB.saveVault(username, defaultData);
    }
    setStorageType('BROWSER');
    setVaultFiles(['[Encrypted IndexedDB]']);
    setIsInitialized(true);
  };

  const saveToDisk = useCallback(async () => {
    if (!currentUser || !isInitialized) return;
    const dataToSave: UserVaultData = {
      userName,
      userLocation,
      startDate,
      tasks,
      stats,
      hydration,
      sleepConfig,
      remindersEnabled
    };
    await vaultDB.saveVault(currentUser, dataToSave);
  }, [currentUser, isInitialized, userName, userLocation, startDate, tasks, stats, hydration, sleepConfig, remindersEnabled]);

  useEffect(() => {
    const boot = async () => {
      const activeUser = await vaultDB.getSession();
      if (activeUser) {
        setCurrentUser(activeUser);
        await loadUserData(activeUser);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => saveToDisk(), 500);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, tasks, stats, hydration, sleepConfig, remindersEnabled, saveToDisk]);

  const signup = async (username: string): Promise<boolean> => {
    const existing = await vaultDB.getUser(username);
    if (existing) return false;
    const newUser: UserAccount = {
      username,
      createdAt: new Date().toISOString()
    };
    await vaultDB.saveUser(newUser);
    return login(username, true);
  };

  const login = async (username: string, remember: boolean): Promise<boolean> => {
    const user = await vaultDB.getUser(username);
    if (!user) return false;
    
    setCurrentUser(username);
    if (remember) await vaultDB.setSession(username);
    await loadUserData(username);
    return true;
  };

  const logout = () => {
    vaultDB.setSession(null);
    setCurrentUser(null);
    setIsInitialized(false);
    setActiveTab(Tab.HOME);
  };

  const exportData = () => {
    if (!currentUser) return;
    const dataToSave = {
      userName, userLocation, startDate, tasks, stats, hydration, sleepConfig, remindersEnabled
    };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panda_mate_${currentUser}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (json: string): Promise<boolean> => {
    try {
      const data = JSON.parse(json);
      applyData(data);
      if (currentUser) {
        await vaultDB.saveVault(currentUser, data);
      }
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  };

  const clearAllData = async () => {
    if (confirm("This will permanently delete ALL users and data on this device. Continue?")) {
      await vaultDB.clearAll();
      window.location.reload();
    }
  };

  const updateDailyCompletion = useCallback((taskList: Task[], targetDate: string) => {
    const dayTasks = taskList.filter(t => t.startTime.startsWith(targetDate));
    if (dayTasks.length === 0) return;
    const completed = dayTasks.filter(t => t.completed).length;
    const percentage = Math.round((completed / dayTasks.length) * 100);
    setStats(prev => ({ ...prev, dailyCompletion: { ...prev.dailyCompletion, [targetDate]: percentage } }));
  }, []);

  const addTask = useCallback((taskData: Partial<Task>) => {
    setTasks(prev => {
      const updated = [...prev];
      let start = taskData.startTime || new Date().toISOString();
      if (taskData.isQuick) {
        const now = new Date();
        now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);
        start = now.toISOString();
        if (updated.some(t => t.startTime === start)) {
          let nextFree = new Date(start);
          while (updated.some(t => t.startTime === nextFree.toISOString())) nextFree.setMinutes(nextFree.getMinutes() + 15);
          start = nextFree.toISOString();
        }
      }
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        name: taskData.name || 'New Task',
        category: taskData.category || 'Break',
        startTime: start,
        durationMinutes: taskData.durationMinutes || 15,
        completed: false,
        isQuick: taskData.isQuick,
        isMedicine: taskData.isMedicine || false,
        isSpacedRepetition: taskData.isSpacedRepetition || false,
        repetitionStep: taskData.repetitionStep || 0,
      };
      const finalTasks = [...updated, newTask];
      updateDailyCompletion(finalTasks, start.split('T')[0]);
      return finalTasks;
    });
  }, [updateDailyCompletion]);

  const addMedicineSchedule = useCallback((name: string, time: string, days: number) => {
    const newTasks: Task[] = [];
    const [h, m] = time.split(':').map(Number);
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(h, m, 0, 0);
      newTasks.push({ id: Math.random().toString(36).substr(2, 9), name: `Medicine: ${name}`, category: 'Medicine', startTime: d.toISOString(), durationMinutes: 5, completed: false, isMedicine: true });
    }
    setTasks(prev => {
      const filtered = prev.filter(t => !newTasks.some(nt => nt.startTime === t.startTime && !t.isMedicine));
      const finalTasks = [...filtered, ...newTasks];
      Array.from(new Set(newTasks.map(nt => nt.startTime.split('T')[0]))).forEach(day => updateDailyCompletion(finalTasks, day));
      return finalTasks;
    });
  }, [updateDailyCompletion]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const isNowCompleted = !prev[idx].completed;
      const updated = [...prev];
      updated[idx] = { ...prev[idx], completed: isNowCompleted };
      if (isNowCompleted) {
        setStats(s => ({ ...s, xp: s.xp + 50 }));
        if (prev[idx].isSpacedRepetition) {
          const step = prev[idx].repetitionStep || 0;
          if (step < SPACED_INTERVALS.length) {
            const next = new Date(prev[idx].startTime);
            next.setDate(next.getDate() + SPACED_INTERVALS[step]);
            updated.push({ ...prev[idx], id: Math.random().toString(36).substr(2, 9), startTime: next.toISOString(), completed: false, repetitionStep: step + 1 });
          }
        }
      }
      updateDailyCompletion(updated, prev[idx].startTime.split('T')[0]);
      return updated;
    });
  }, [updateDailyCompletion]);

  const deleteTask = (id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      const filtered = prev.filter(t => t.id !== id);
      if (task) updateDailyCompletion(filtered, task.startTime.split('T')[0]);
      return filtered;
    });
  };
  
  const copySchedule = useCallback((source: string, target: string, ids: string[]) => {
    const sourceTasks = tasks.filter(t => t.startTime.startsWith(source) && ids.includes(t.id) && !t.isQuick && !t.isSpacedRepetition && !t.isMedicine);
    const newTasks = sourceTasks.map(t => {
      const orig = new Date(t.startTime);
      const next = new Date(target);
      next.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
      return { ...t, id: Math.random().toString(36).substr(2, 9), startTime: next.toISOString(), completed: false };
    });
    setTasks(prev => {
      const filtered = prev.filter(t => !t.startTime.startsWith(target) || !newTasks.some(nt => nt.startTime === t.startTime && !t.isMedicine));
      const final = [...filtered, ...newTasks];
      updateDailyCompletion(final, target);
      return final;
    });
  }, [tasks, updateDailyCompletion]);

  const setMainTask = (name: string, date: string) => setStats(prev => ({ ...prev, mainTask: { name, targetDate: date } }));
  const addXP = (amount: number) => setStats(prev => ({ ...prev, xp: prev.xp + amount }));

  return (
    <AppContext.Provider value={{
      tasks, addTask, addMedicineSchedule, toggleTask, deleteTask, copySchedule,
      stats, addXP, pandaState, setPandaState, activeTab, setActiveTab,
      hydration, setHydration, sleepConfig, setSleepConfig,
      userName, setUserName, remindersEnabled, setRemindersEnabled,
      schedulerDate, setSchedulerDate, setMainTask, isInitialized,
      currentUser, login, signup, logout, exportData, importData, clearAllData,
      userLocation, startDate, storageType, vaultFiles
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
