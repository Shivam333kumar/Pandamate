
import React, { useState, useMemo } from 'react';
import { Plus, Clock, RefreshCw, Copy, Check, X, Save, ChevronLeft, ChevronRight, Calendar, Pill, Moon, History } from 'lucide-react';
import { useApp } from '../state';
import { CATEGORY_COLORS, CategoryType, Task } from '../types';

const SchedulerTab: React.FC = () => {
  const { tasks, addTask, toggleTask, sleepConfig, copySchedule, schedulerDate, setSchedulerDate } = useApp();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Mind');
  const [isSpaced, setIsSpaced] = useState(false);
  const [targetTime, setTargetTime] = useState<string | null>(null);

  const [copySourceDate, setCopySourceDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  });
  
  const [copyList, setCopyList] = useState<{ id: string; name: string; category: CategoryType; selected: boolean }[]>([]);

  const slots = useMemo(() => {
    const s = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        s.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }
    return s;
  }, []);

  const activeDateStr = useMemo(() => {
    return `${schedulerDate.getFullYear()}-${String(schedulerDate.getMonth() + 1).padStart(2, '0')}-${String(schedulerDate.getDate()).padStart(2, '0')}`;
  }, [schedulerDate]);

  const displayedTasks = useMemo(() => {
    return tasks.filter(t => {
      const d = new Date(t.startTime);
      const taskDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return taskDateStr === activeDateStr;
    });
  }, [tasks, activeDateStr]);

  const handleOpenDrawer = (time?: string) => {
    setTargetTime(time || null);
    setNewTaskName('');
    setIsSpaced(false);
    setShowDrawer(true);
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const d = new Date(schedulerDate);
    let startTimeStr = d.toISOString();
    if (targetTime) {
      const [h, m] = targetTime.split(':').map(Number);
      d.setHours(h, m, 0, 0);
      startTimeStr = d.toISOString();
    }
    addTask({ 
      name: newTaskName, 
      category: selectedCategory, 
      startTime: startTimeStr, 
      durationMinutes: 15, 
      isSpacedRepetition: isSpaced 
    });
    setShowDrawer(false);
  };

  const openCopyModal = () => {
    updateCopyList(copySourceDate);
    setShowCopyModal(true);
  };

  const updateCopyList = (dateStr: string) => {
    const tasksFromDate = tasks.filter(t => {
      const d = new Date(t.startTime);
      const taskDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return taskDateStr === dateStr && !t.isQuick && !t.isSpacedRepetition && !t.isMedicine;
    });
    setCopyList(tasksFromDate.map(t => ({ id: t.id, name: t.name, category: t.category, selected: true })));
  };

  const handleConfirmCopy = () => {
    const selectedIds = copyList.filter(item => item.selected).map(item => item.id);
    if (selectedIds.length > 0) {
      copySchedule(copySourceDate, activeDateStr, selectedIds);
      alert(`Cloned ${selectedIds.length} tasks! Standard mission data merged.`);
    }
    setShowCopyModal(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col bg-white/40 p-4 rounded-3xl border border-white/50 shadow-sm gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => {const d = new Date(schedulerDate); d.setDate(d.getDate()-1); setSchedulerDate(d);}} className="p-2 bg-white/60 rounded-xl shadow-sm"><ChevronLeft size={16} /></button>
            <div className="flex flex-col items-center min-w-[100px]">
               <h2 className="text-sm font-black text-gray-800">{schedulerDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h2>
               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{schedulerDate.toLocaleDateString(undefined, { weekday: 'long' })}</span>
            </div>
            <button onClick={() => {const d = new Date(schedulerDate); d.setDate(d.getDate()+1); setSchedulerDate(d);}} className="p-2 bg-white/60 rounded-xl shadow-sm"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => handleOpenDrawer()} className="flex items-center gap-2 bg-[#000080] text-white px-4 py-2 rounded-2xl font-black text-xs shadow-lg shadow-blue-200 active:scale-95 transition-transform">
            <Plus size={16} /> Add Task
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={openCopyModal} className="flex-1 flex items-center justify-center gap-2 bg-white/80 text-[#000080] py-2.5 rounded-xl text-[10px] font-black border border-blue-100 shadow-sm active:bg-blue-50 transition-colors">
            <History size={12} /> Clone History Plan
          </button>
          <button onClick={() => setSchedulerDate(new Date())} className="px-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 text-[10px] font-black active:scale-95 transition-all">Today</button>
        </div>
      </div>

      {/* Slots */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 relative pr-1 pb-10">
        {slots.map((time) => {
          const [h, m] = time.split(':').map(Number);
          const currentSlotMins = h * 60 + m;

          const [bh, bm] = sleepConfig.bedtime.split(':').map(Number);
          const bedtimeMins = bh * 60 + bm;
          const wakeMins = (bedtimeMins + sleepConfig.duration * 60) % 1440;
          let isSleep = bedtimeMins < wakeMins ? (currentSlotMins >= bedtimeMins && currentSlotMins < wakeMins) : (currentSlotMins >= bedtimeMins || currentSlotMins < wakeMins);

          const taskAtSlot = displayedTasks.find(t => {
            const date = new Date(t.startTime);
            const taskStartMins = date.getHours() * 60 + date.getMinutes();
            return currentSlotMins >= taskStartMins && currentSlotMins < taskStartMins + 15;
          });

          const isMedicine = taskAtSlot?.isMedicine;

          return (
            <div key={time} className="flex items-center gap-3">
              <span className={`text-[9px] font-black w-8 ${isSleep ? 'text-teal-400' : 'text-gray-400'}`}>{time}</span>
              <div 
                className={`flex-1 min-h-[44px] border-b border-gray-100 flex items-center cursor-pointer transition-colors ${!taskAtSlot && !isSleep ? 'hover:bg-indigo-50/50' : ''}`}
                onClick={() => !taskAtSlot && handleOpenDrawer(time)}
              >
                {taskAtSlot ? (
                  <div 
                    className={`w-full p-2 rounded-xl flex justify-between items-center text-white shadow-sm transition-opacity ${taskAtSlot.completed ? 'opacity-40 grayscale' : 'opacity-100'} ${isMedicine ? 'bg-red-600 animate-pulse ring-2 ring-red-100' : ''}`}
                    style={{ backgroundColor: isMedicine ? undefined : CATEGORY_COLORS[taskAtSlot.category] }}
                    onClick={(e) => { e.stopPropagation(); toggleTask(taskAtSlot.id); }}
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className={`font-black text-[11px] truncate ${taskAtSlot.completed ? 'line-through' : ''}`}>
                        {taskAtSlot.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                         <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter">
                          {isMedicine ? 'URGENT MEDICAL' : taskAtSlot.category}
                        </span>
                        {taskAtSlot.isSpacedRepetition && <span className="text-[7px] font-black px-1 rounded-full bg-white/20">SPACED</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isMedicine && <Pill size={14} />}
                      {taskAtSlot.isSpacedRepetition && <RefreshCw size={12} className="animate-spin-slow opacity-80" />}
                      {taskAtSlot.completed && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                ) : isSleep ? (
                  <div className="w-full h-8 rounded-lg bg-teal-50/30 border border-dashed border-teal-100 flex items-center px-3 gap-2 opacity-60">
                    <Moon size={12} className="text-teal-400" />
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Sleep Cycle</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-600 p-8 text-white text-center">
              <History size={48} className="mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-black">Temporal Clone</h3>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">Mirror Historical Data</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Source Target Day</label>
                <input 
                  type="date" 
                  value={copySourceDate}
                  onChange={(e) => {
                    setCopySourceDate(e.target.value);
                    updateCopyList(e.target.value);
                  }}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="max-h-[150px] overflow-y-auto no-scrollbar space-y-2 py-2 border-y border-gray-50">
                {copyList.length > 0 ? (
                  copyList.map((item, idx) => (
                    <label key={item.id} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 cursor-pointer active:scale-95 transition-transform">
                      <input 
                        type="checkbox" 
                        checked={item.selected}
                        onChange={() => {
                          const newList = [...copyList];
                          newList[idx].selected = !newList[idx].selected;
                          setCopyList(newList);
                        }}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <span className="text-xs font-black text-gray-700 truncate">{item.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-[10px] font-bold text-gray-400 text-center py-4 uppercase tracking-widest">No valid missions on this date</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={handleConfirmCopy} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all">CLONE SELECTED</button>
                <button onClick={() => setShowCopyModal(false)} className="w-full py-3 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Abort Mission</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[200] flex items-center justify-center px-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-1 text-blue-600 text-center">Plan Mission</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase text-center mb-6">Deploying to {activeDateStr} @ {targetTime || 'Now'}</p>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Mission Name" 
                value={newTaskName} 
                onChange={(e) => setNewTaskName(e.target.value)} 
                className="w-full bg-gray-50 p-4 rounded-2xl outline-none border border-gray-100 font-bold focus:ring-4 focus:ring-blue-100 transition-all" 
              />
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {(Object.keys(CATEGORY_COLORS) as CategoryType[]).filter(c => c !== 'Medicine' && c !== 'Sleep').map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <button 
                type="button"
                onClick={() => setIsSpaced(!isSpaced)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSpaced ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-gray-50 border-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className={`${isSpaced ? 'text-blue-600 animate-spin-slow' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <span className={`text-sm font-black block ${isSpaced ? 'text-blue-800' : 'text-gray-400'}`}>Spaced Mastery</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">1-3-7-11 Day Intervals</span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isSpaced ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isSpaced ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </button>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => setShowDrawer(false)} className="bg-gray-100 py-4 rounded-2xl font-black text-gray-400 text-sm active:scale-95 transition-all">Cancel</button>
                <button onClick={handleAddTask} className="bg-[#000080] text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-blue-100 transition-all">Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerTab;
