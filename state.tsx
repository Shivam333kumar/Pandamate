
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, UserStats, CategoryType, PandaState, Tab, MainTask } from './types';

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
  initializeProfile: (name: string, location?: string, forceBrowserStorage?: boolean) => Promise<boolean>;
  userLocation: string;
  startDate: string;
  needsPermission: boolean;
  requestFileSystemPermission: () => Promise<void>;
  storageType: 'FOLDER' | 'BROWSER' | 'NONE';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DATA_FILENAME = 'panda_vault.json';
const SPACED_INTERVALS = [1, 3, 7, 11];

// Helper to interact with IndexedDB to store handles and browser-based data
const vaultDB = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('PandaVault', 2);
      req.onupgradeneeded = (e) => {
        const db = req.result;
        if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata');
        if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async setHandle(handle: FileSystemDirectoryHandle | string) {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('metadata', 'readwrite');
      tx.objectStore('metadata').put(handle, 'storage_handle');
      tx.oncomplete = () => resolve(true);
    });
  },
  async getHandle(): Promise<FileSystemDirectoryHandle | string | null> {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('metadata', 'readonly');
      const req = tx.objectStore('metadata').get('storage_handle');
      req.onsuccess = () => resolve(req.result || null);
    });
  },
  async setBrowserData(data: string) {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('data', 'readwrite');
      tx.objectStore('data').put(data, 'main_vault');
      tx.oncomplete = () => resolve(true);
    });
  },
  async getBrowserData(): Promise<string | null> {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('data', 'readonly');
      const req = tx.objectStore('data').get('main_vault');
      req.onsuccess = () => resolve(req.result || null);
    });
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [userName, setUserName] = useState('PandaUser');
  const [userLocation, setUserLocation] = useState('Unknown Base');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>({ streak: 0, xp: 0, hydrationCount: 0, lastHydrationUpdate: Date.now(), dailyCompletion: {} });
  const [hydration, setHydration] = useState(0);
  const [sleepConfig, setSleepConfig] = useState({ bedtime: "22:00", duration: 8 });
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [storageType, setStorageType] = useState<'FOLDER' | 'BROWSER' | 'NONE'>('NONE');
  const [needsPermission, setNeedsPermission] = useState(false);
  
  const [pandaState, setPandaState] = useState<PandaState>('IDLE');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [schedulerDate, setSchedulerDate] = useState(new Date());

  const applyData = (data: any) => {
    setUserName(data.userName || 'PandaUser');
    setUserLocation(data.userLocation || 'Unknown Base');
    setStartDate(data.startDate || new Date().toISOString().split('T')[0]);
    setTasks(data.tasks || []);
    setStats(data.stats || { streak: 0, xp: 0, hydrationCount: 0, lastHydrationUpdate: Date.now(), dailyCompletion: {} });
    setHydration(data.hydration || 0);
    setSleepConfig(data.sleepConfig || { bedtime: "22:00", duration: 8 });
    setRemindersEnabled(data.remindersEnabled !== undefined ? data.remindersEnabled : true);
    setIsInitialized(true);
  };

  const loadFromFile = async (handle: FileSystemDirectoryHandle) => {
    try {
      const fileHandle = await handle.getFileHandle(DATA_FILENAME, { create: true });
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text) return false;
      applyData(JSON.parse(text));
      return true;
    } catch (e) {
      console.error("Failed to load from file:", e);
      return false;
    }
  };

  const saveToDisk = useCallback(async () => {
    const dataToSave = {
      userName,
      userLocation,
      startDate,
      tasks,
      stats,
      hydration,
      sleepConfig,
      remindersEnabled
    };
    const payload = JSON.stringify(dataToSave);

    if (storageType === 'FOLDER' && dirHandle) {
      try {
        // @ts-ignore
        const status = await dirHandle.queryPermission({ mode: 'readwrite' });
        if (status !== 'granted') return;
        const fileHandle = await dirHandle.getFileHandle(DATA_FILENAME, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(payload);
        await writable.close();
      } catch (e) {
        console.error("Folder save failed:", e);
      }
    } else if (storageType === 'BROWSER') {
      await vaultDB.setBrowserData(payload);
    }
  }, [dirHandle, storageType, userName, userLocation, startDate, tasks, stats, hydration, sleepConfig, remindersEnabled]);

  useEffect(() => {
    const boot = async () => {
      try {
        const saved = await vaultDB.getHandle();
        if (saved === 'BROWSER_VAULT') {
          setStorageType('BROWSER');
          const data = await vaultDB.getBrowserData();
          if (data) applyData(JSON.parse(data));
          else setIsInitialized(false);
        } else if (saved && typeof saved !== 'string') {
          const handle = saved as FileSystemDirectoryHandle;
          setDirHandle(handle);
          setStorageType('FOLDER');
          // @ts-ignore
          const status = await handle.queryPermission({ mode: 'readwrite' });
          if (status === 'granted') await loadFromFile(handle);
          else setNeedsPermission(true);
        }
      } catch (e) {
        console.error("Boot error:", e);
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

  const requestFileSystemPermission = async () => {
    if (!dirHandle) return;
    try {
      // @ts-ignore
      const status = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (status === 'granted') {
        setNeedsPermission(false);
        await loadFromFile(dirHandle);
      }
    } catch (e) {
      console.error("Permission request failed:", e);
    }
  };

  const initializeProfile = async (name: string, location?: string, forceBrowserStorage?: boolean): Promise<boolean> => {
    try {
      if (forceBrowserStorage) {
        await vaultDB.setHandle('BROWSER_VAULT');
        setStorageType('BROWSER');
      } else {
        // Wrap in a try-catch specifically for SecurityErrors in framed environments
        let handle;
        try {
          // @ts-ignore
          handle = await window.showDirectoryPicker();
        } catch (pickerError: any) {
          if (pickerError.name === 'SecurityError' || pickerError.message?.includes('Cross origin')) {
            throw new Error('BROWSER_RESTRICTED');
          }
          throw pickerError;
        }
        await vaultDB.setHandle(handle);
        setDirHandle(handle);
        setStorageType('FOLDER');
      }
      
      const today = new Date().toISOString().split('T')[0];
      setUserName(name);
      setStartDate(today);
      if (location) setUserLocation(location);
      setIsInitialized(true);
      
      setTimeout(() => saveToDisk(), 100);
      return true;
    } catch (e: any) {
      if (e.message === 'BROWSER_RESTRICTED') throw e;
      console.error("Initialization error:", e);
      return false;
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
      schedulerDate, setSchedulerDate, setMainTask, isInitialized, initializeProfile, userLocation, startDate,
      needsPermission, requestFileSystemPermission, storageType
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
