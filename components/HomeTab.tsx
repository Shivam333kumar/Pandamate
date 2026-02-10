
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Check, Droplets, Zap, Target, Pill, Clock, ListTodo, RefreshCw, ChevronRight, HardDrive, ShieldCheck, Calendar } from 'lucide-react';
import { useApp } from '../state';
import { CATEGORY_COLORS, CategoryType, Tab } from '../types';

const HomeTab: React.FC = () => {
  const { tasks, addTask, addMedicineSchedule, toggleTask, hydration, setHydration, setActiveTab, userName, sleepConfig } = useApp();
  const [fastTask, setFastTask] = useState('');
  const [fastCategory, setFastCategory] = useState<CategoryType>('Mind');

  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('08:00');
  const [medDays, setMedDays] = useState(7);
  
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todaysTasks = useMemo(() => {
    return tasks
      .filter(t => t.startTime.startsWith(todayStr))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [tasks, todayStr]);

  const nextTask = useMemo(() => {
    const now = new Date().getTime();
    return todaysTasks.find(t => !t.completed && new Date(t.startTime).getTime() > now - 900000);
  }, [todaysTasks]);

  const completionPercentage = useMemo(() => {
    if (todaysTasks.length === 0) return 0;
    return Math.round((todaysTasks.filter(t => t.completed).length / todaysTasks.length) * 100);
  }, [todaysTasks]);

  const distributionData = useMemo(() => {
    const TOTAL_SLOTS = 288;
    const counts: Record<string, number> = {
      'Sleep': 0, 'Mind': 0, 'Body': 0, 'Study': 0, 'Medicine': 0, 'Free Time': 0
    };

    const [bHour, bMin] = sleepConfig.bedtime.split(':').map(Number);
    const bedtimeMins = bHour * 60 + bMin;
    const sleepDurationMins = sleepConfig.duration * 60;
    const wakeMins = (bedtimeMins + sleepDurationMins) % 1440;

    const taskSlotMap = new Array(TOTAL_SLOTS).fill(null);
    todaysTasks.forEach(task => {
      const taskDate = new Date(task.startTime);
      const startMins = taskDate.getHours() * 60 + taskDate.getMinutes();
      const endMins = startMins + task.durationMinutes;
      const startSlot = Math.floor(startMins / 5);
      const endSlot = Math.ceil(endMins / 5);
      for (let s = startSlot; s < endSlot && s < TOTAL_SLOTS; s++) taskSlotMap[s] = task.category;
    });

    for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
      const currentMin = slot * 5;
      let isSleep = bedtimeMins < wakeMins ? (currentMin >= bedtimeMins && currentMin < wakeMins) : (currentMin >= bedtimeMins || currentMin < wakeMins);
      if (isSleep) counts['Sleep']++;
      else {
        const cat = taskSlotMap[slot];
        if (cat === 'Mind') counts['Mind']++;
        else if (cat === 'Body') counts['Body']++;
        else if (cat === 'Spirit') counts['Study']++;
        else if (cat === 'Medicine') counts['Medicine']++;
        else counts['Free Time']++;
      }
    }

    return [
      { name: 'Sleep', value: counts['Sleep'], color: CATEGORY_COLORS['Sleep'] },
      { name: 'Mind', value: counts['Mind'], color: CATEGORY_COLORS['Mind'] },
      { name: 'Body', value: counts['Body'], color: CATEGORY_COLORS['Body'] },
      { name: 'Study', value: counts['Study'], color: CATEGORY_COLORS['Spirit'] },
      { name: 'Medicine', value: counts['Medicine'], color: CATEGORY_COLORS['Medicine'] },
      { name: 'Free', value: counts['Free Time'], color: '#E2E8F0' }
    ].filter(d => d.value > 0);
  }, [todaysTasks, sleepConfig]);

  const handleFastTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastTask.trim()) return;
    addTask({ name: fastTask, category: fastCategory, isQuick: true });
    setFastTask('');
  };

  const handleMedSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    addMedicineSchedule(medName, medTime, medDays);
    setMedName('');
    alert("Medicine Protocol Deployed! Alarms active.");
  };

  return (
    <div className="tab-content h-full overflow-y-auto no-scrollbar px-4 space-y-6 pb-24">
      <div className="pt-4 flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h1 className="text-3xl font-black text-[#1C1B1F] tracking-tight">Welcome, {userName}</h1>
          </div>
          <p className="text-sm font-bold text-[#49454F] opacity-70">Vault Status: Optimized</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            <HardDrive size={12} className="text-emerald-600" />
            <span className="text-[9px] font-black text-emerald-700 uppercase">Secured</span>
          </div>
        </div>
      </div>

      {/* Next Up Priority Card */}
      {nextTask && (
        <div className="m3-card p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Next Priority Mission</span>
            <div className="bg-white/20 p-2 rounded-xl"><Target size={18} /></div>
          </div>
          <h3 className="text-xl font-black mb-1 truncate">{nextTask.name}</h3>
          <div className="flex items-center gap-2 opacity-80 mb-6">
            <Clock size={14} />
            <span className="text-sm font-bold">{new Date(nextTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button onClick={() => toggleTask(nextTask.id)} className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform">COMPLETE TARGET</button>
        </div>
      )}

      {/* Today's Agenda */}
      <div className="m3-card p-6 bg-white shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ListTodo size={20} className="text-indigo-500" />
            <h4 className="font-black text-[#1C1B1F]">Today's Agenda</h4>
          </div>
          <button onClick={() => setActiveTab(Tab.SCHEDULER)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">Full View <ChevronRight size={12}/></button>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
          {todaysTasks.length > 0 ? (
            todaysTasks.map((task) => (
              <div key={task.id} onClick={() => toggleTask(task.id)} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${task.completed ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${task.isMedicine ? 'animate-pulse' : ''}`} style={{ backgroundColor: CATEGORY_COLORS[task.category] }}>
                  {task.isMedicine ? <Pill size={18} /> : task.isSpacedRepetition ? <RefreshCw size={18} /> : <Target size={18} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h5 className={`font-black text-[13px] truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.name}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><Clock size={10} /> {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200'}`}>
                  {task.completed && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-10 opacity-30 text-center">
              <ListTodo size={40} className="mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">No Missions Scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Medicine Protocol restore */}
      <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pill size={20} className="text-red-600" />
            <h4 className="font-black text-red-900">Medicine Protocol</h4>
          </div>
          <span className="text-[8px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Alarm Active</span>
        </div>
        <form onSubmit={handleMedSchedule} className="space-y-3">
          <input 
            type="text" 
            value={medName} 
            onChange={(e) => setMedName(e.target.value)} 
            placeholder="Medicine Name..." 
            className="w-full bg-white px-5 py-3 rounded-2xl outline-none border border-red-100 font-bold text-red-900 shadow-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-300" />
              <input 
                type="time" 
                value={medTime} 
                onChange={(e) => setMedTime(e.target.value)} 
                className="w-full bg-white pl-10 pr-4 py-3 rounded-2xl outline-none border border-red-100 font-bold text-red-800 text-xs" 
              />
            </div>
            <div className="relative">
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-300" />
              <input 
                type="number" 
                value={medDays} 
                onChange={(e) => setMedDays(parseInt(e.target.value))} 
                placeholder="Days"
                className="w-full bg-white pl-10 pr-4 py-3 rounded-2xl outline-none border border-red-100 font-bold text-red-800 text-xs" 
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-red-100 active:scale-95 transition-all">DEPLOY SCHEDULE</button>
        </form>
      </div>

      {/* Composition Chart */}
      <div className="m3-card p-6 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-[#1C1B1F] text-sm">Time Allocation</h3>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">{completionPercentage}% Success Rate</span>
        </div>
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distributionData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Instant Mission */}
      <div className="bg-[#EADDFF] p-6 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-[#21005D]" />
          <h4 className="font-black text-[#21005D]">Instant Mission</h4>
        </div>
        <form onSubmit={handleFastTask} className="space-y-4">
          <input type="text" value={fastTask} onChange={(e) => setFastTask(e.target.value)} placeholder="Quick entry..." className="w-full bg-white px-5 py-4 rounded-2xl outline-none font-bold" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {(Object.keys(CATEGORY_COLORS) as CategoryType[]).filter(c => c !== 'Medicine' && c !== 'Sleep').map(cat => (
              <button key={cat} type="button" onClick={() => setFastCategory(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${fastCategory === cat ? 'bg-[#21005D] text-white shadow-md' : 'bg-white text-[#49454F]'}`}>{cat === 'Spirit' ? 'Study' : cat}</button>
            ))}
          </div>
          <button type="submit" className="w-full bg-[#6750A4] text-white py-4 rounded-2xl font-black text-sm shadow-lg">LAUNCH NOW</button>
        </form>
      </div>

      {/* Hydration Tracker */}
      <div className="m3-card p-6 bg-white mb-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Droplets size={20} className="text-blue-500" />
            <span className="font-black text-[#1C1B1F]">Hydration Level</span>
          </div>
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{hydration}/8 UNITS</span>
        </div>
        <div className="flex justify-between gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <button key={i} onClick={() => setHydration(i + 1)} className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all ${i < hydration ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-200'}`}>
              <Droplets size={16} fill={i < hydration ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
