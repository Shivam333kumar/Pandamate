
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SPACED_INTERVALS = [1, 3, 7, 11];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('panda_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('panda_stats');
    return saved ? JSON.parse(saved) : { 
      streak: 0, 
      xp: 0, 
      hydrationCount: 0, 
      lastHydrationUpdate: Date.now(),
      dailyCompletion: {}
    };
  });

  const [pandaState, setPandaState] = useState<PandaState>('IDLE');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [schedulerDate, setSchedulerDate] = useState(new Date());
  const [hydration, setHydration] = useState(0);
  const [sleepConfig, setSleepConfig] = useState({ bedtime: "22:00", duration: 8 });
  const [userName, setUserName] = useState(() => localStorage.getItem('panda_username') || 'PandaUser');
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem('panda_reminders') === 'true');

  useEffect(() => {
    localStorage.setItem('panda_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('panda_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('panda_username', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('panda_reminders', remindersEnabled.toString());
  }, [remindersEnabled]);

  const updateDailyCompletion = useCallback((taskList: Task[], targetDate: string) => {
    const dayTasks = taskList.filter(t => t.startTime.startsWith(targetDate));
    if (dayTasks.length === 0) return;

    const completed = dayTasks.filter(t => t.completed).length;
    const percentage = Math.round((completed / dayTasks.length) * 100);

    setStats(prev => ({
      ...prev,
      dailyCompletion: {
        ...prev.dailyCompletion,
        [targetDate]: percentage
      }
    }));
  }, []);

  const addTask = useCallback((taskData: Partial<Task>) => {
    setTasks(prev => {
      const updated = [...prev];
      let start = taskData.startTime || new Date().toISOString();
      
      if (taskData.isQuick) {
        const now = new Date();
        const minutes = Math.floor(now.getMinutes() / 15) * 15;
        now.setMinutes(minutes, 0, 0);
        start = now.toISOString();

        const hasMedicineConflict = updated.some(t => t.isMedicine && t.startTime === start);
        
        if (hasMedicineConflict) {
          let nextFree = new Date(start);
          while (updated.some(t => t.startTime === nextFree.toISOString())) {
            nextFree.setMinutes(nextFree.getMinutes() + 5); 
          }
          start = nextFree.toISOString();
        } else {
          const existingIdx = updated.findIndex(t => t.startTime === start && !t.isMedicine);
          if (existingIdx !== -1) {
            let nextFree = new Date(start);
            while (updated.some(t => t.startTime === nextFree.toISOString())) {
              nextFree.setMinutes(nextFree.getMinutes() + 15);
            }
            const displaced = { ...updated[existingIdx], startTime: nextFree.toISOString() };
            updated[existingIdx] = displaced;
          }
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
      
      newTasks.push({
        id: Math.random().toString(36).substr(2, 9),
        name: `Medicine: ${name}`,
        category: 'Medicine',
        startTime: d.toISOString(),
        durationMinutes: 5,
        completed: false,
        isMedicine: true
      });
    }

    setTasks(prev => {
      const filtered = prev.filter(t => {
        const isConflict = newTasks.some(nt => nt.startTime === t.startTime);
        return !(isConflict && !t.isMedicine);
      });
      const finalTasks = [...filtered, ...newTasks];
      // Update completion for all affected days
      const affectedDays = Array.from(new Set(newTasks.map(nt => nt.startTime.split('T')[0])));
      affectedDays.forEach(day => updateDailyCompletion(finalTasks, day));
      return finalTasks;
    });
  }, [updateDailyCompletion]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;
      
      const task = prev[taskIndex];
      const isNowCompleted = !task.completed;
      const updatedTasks = [...prev];
      updatedTasks[taskIndex] = { ...task, completed: isNowCompleted };

      if (isNowCompleted) {
        setStats(s => ({ ...s, xp: s.xp + 50 }));
        
        if (task.isSpacedRepetition) {
          const currentStep = task.repetitionStep || 0;
          if (currentStep < SPACED_INTERVALS.length) {
            const nextDate = new Date(task.startTime);
            nextDate.setDate(nextDate.getDate() + SPACED_INTERVALS[currentStep]);
            
            updatedTasks.push({
              ...task,
              id: Math.random().toString(36).substr(2, 9),
              startTime: nextDate.toISOString(),
              completed: false,
              repetitionStep: currentStep + 1
            });
          }
        }
      }
      
      const day = task.startTime.split('T')[0];
      updateDailyCompletion(updatedTasks, day);
      return updatedTasks;
    });
  }, [updateDailyCompletion]);

  const deleteTask = (id: string) => {
    setTasks(prev => {
      const taskToDelete = prev.find(t => t.id === id);
      const filtered = prev.filter(t => t.id !== id);
      if (taskToDelete) {
        updateDailyCompletion(filtered, taskToDelete.startTime.split('T')[0]);
      }
      return filtered;
    });
  };
  
  const copySchedule = useCallback((sourceDate: string, targetDate: string, taskIds: string[]) => {
    const sourceTasks = tasks.filter(t => {
      const d = new Date(t.startTime);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === sourceDate && taskIds.includes(t.id) && !t.isQuick && !t.isSpacedRepetition && !t.isMedicine;
    });
    
    const newTasks = sourceTasks.map(t => {
      const originalDate = new Date(t.startTime);
      const newStartTime = new Date(targetDate);
      newStartTime.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
      return { 
        ...t, 
        id: Math.random().toString(36).substr(2, 9), 
        startTime: newStartTime.toISOString(), 
        completed: false 
      };
    });
    
    setTasks(prev => {
      const filtered = prev.filter(t => {
        const taskDate = new Date(t.startTime);
        const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
        if (taskDateStr !== targetDate) return true;
        
        const isConflict = newTasks.some(nt => nt.startTime === t.startTime);
        return !(isConflict && !t.isMedicine && !t.isSpacedRepetition);
      });
      const finalTasks = [...filtered, ...newTasks];
      updateDailyCompletion(finalTasks, targetDate);
      return finalTasks;
    });
  }, [tasks, updateDailyCompletion]);

  const setMainTask = (name: string, date: string) => {
    setStats(prev => ({
      ...prev,
      mainTask: { name, targetDate: date }
    }));
  };

  const addXP = (amount: number) => setStats(prev => ({ ...prev, xp: prev.xp + amount }));

  return (
    <AppContext.Provider value={{
      tasks, addTask, addMedicineSchedule, toggleTask, deleteTask, copySchedule,
      stats, addXP, pandaState, setPandaState, activeTab, setActiveTab,
      hydration, setHydration, sleepConfig, setSleepConfig,
      userName, setUserName, remindersEnabled, setRemindersEnabled,
      schedulerDate, setSchedulerDate, setMainTask
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
