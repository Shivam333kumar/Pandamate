
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
  initializeProfile: (name: string, location?: string) => Promise<void>;
  userLocation: string;
  startDate: string;
  needsPermission: boolean;
  requestFileSystemPermission: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DATA_FILENAME = 'panda_vault.json';
const SPACED_INTERVALS = [1, 3, 7, 11];

// Helper to interact with IndexedDB to store the directory handle
const handleStore = {
  async set(handle: FileSystemDirectoryHandle) {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(handle, 'root');
      tx.oncomplete = () => resolve(true);
    });
  },
  async get(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('handles', 'readonly');
      const req = tx.objectStore('handles').get('root');
      req.onsuccess = () => resolve(req.result || null);
    });
  },
  open(): Promise<IDBDatabase> {
    return new Promise((resolve) => {
      const req = indexedDB.open('PandaStorage', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('handles');
      req.onsuccess = () => resolve(req.result);
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
  const [needsPermission, setNeedsPermission] = useState(false);
  
  const [pandaState, setPandaState] = useState<PandaState>('IDLE');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [schedulerDate, setSchedulerDate] = useState(new Date());

  // Load from File System
  const loadData = async (handle: FileSystemDirectoryHandle) => {
    try {
      const fileHandle = await handle.getFileHandle(DATA_FILENAME, { create: true });
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text) return false;
      
      const data = JSON.parse(text);
      setUserName(data.userName || 'PandaUser');
      setUserLocation(data.userLocation || 'Unknown Base');
      setStartDate(data.startDate || new Date().toISOString().split('T')[0]);
      setTasks(data.tasks || []);
      setStats(data.stats || { streak: 0, xp: 0, hydrationCount: 0, lastHydrationUpdate: Date.now(), dailyCompletion: {} });
      setHydration(data.hydration || 0);
      setSleepConfig(data.sleepConfig || { bedtime: "22:00", duration: 8 });
      setRemindersEnabled(data.remindersEnabled !== undefined ? data.remindersEnabled : true);
      setIsInitialized(true);
      return true;
    } catch (e) {
      console.error("Failed to load from file:", e);
      return false;
    }
  };

  // Save to File System (Compressed/Minified)
  const saveToDisk = useCallback(async () => {
    if (!dirHandle) return;
    try {
      // Check if we still have permission
      // @ts-ignore - queryPermission might be missing from some browser type definitions
      const status = await dirHandle.queryPermission({ mode: 'readwrite' });
      if (status !== 'granted') return;

      const fileHandle = await dirHandle.getFileHandle(DATA_FILENAME, { create: true });
      const writable = await fileHandle.createWritable();
      
      const payload = JSON.stringify({
        userName,
        userLocation,
        startDate,
        tasks,
        stats,
        hydration,
        sleepConfig,
        remindersEnabled
      }); // Compressed naturally as a single line JSON string
      
      await writable.write(payload);
      await writable.close();
    } catch (e) {
      console.error("Autosave failed:", e);
    }
  }, [dirHandle, userName, userLocation, startDate, tasks, stats, hydration, sleepConfig, remindersEnabled]);

  // Initial Boot: Look for existing handle
  useEffect(() => {
    const boot = async () => {
      const savedHandle = await handleStore.get();
      if (savedHandle) {
        setDirHandle(savedHandle);
        // @ts-ignore - queryPermission might be missing from some browser type definitions
        const status = await savedHandle.queryPermission({ mode: 'readwrite' });
        if (status === 'granted') {
          await loadData(savedHandle);
        } else {
          setNeedsPermission(true);
        }
      }
    };
    boot();
  }, []);

  // Autosave trigger
  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => saveToDisk(), 500);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, tasks, stats, hydration, sleepConfig, remindersEnabled, saveToDisk]);

  const requestFileSystemPermission = async () => {
    if (!dirHandle) return;
    // @ts-ignore - requestPermission might be missing from some browser type definitions
    const status = await dirHandle.requestPermission({ mode: 'readwrite' });
    if (status === 'granted') {
      setNeedsPermission(false);
      await loadData(dirHandle);
    }
  };

  const initializeProfile = async (name: string, location?: string) => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      await handleStore.set(handle);
      setDirHandle(handle);
      
      const today = new Date().toISOString().split('T')[0];
      setUserName(name);
      setStartDate(today);
      if (location) setUserLocation(location);
      setIsInitialized(true);
      
      // Save initial state
      setTimeout(() => saveToDisk(), 100);
    } catch (e) {
      console.error("Initialization cancelled or failed:", e);
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
      const d = new Date