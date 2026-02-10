
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from 'recharts';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, Zap, History, ArrowUpRight, ArrowDownRight, Minus, MousePointer2, Target, Trophy, Clock, Edit3 } from 'lucide-react';
import { useApp } from '../state';
import { Tab } from '../types';

const AnalyticsTab: React.FC = () => {
  const { stats, setActiveTab, setSchedulerDate, setMainTask } = useApp();
  const [viewDate, setViewDate] = useState(new Date());
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [mainName, setMainName] = useState(stats.mainTask?.name || '');
  const [mainDate, setMainDate] = useState(stats.mainTask?.targetDate || '');
  const gridEndRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const fullYearLog = useMemo(() => {
    const days = [];
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 364);

    let counter = 1;
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const percentage = stats.dailyCompletion[iso] ?? 0;
      days.push({ 
        iso, 
        percentage, 
        dateObj: new Date(d),
        dayIndex: counter++, 
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: iso === todayStr
      });
    }
    return days;
  }, [stats.dailyCompletion, todayStr]);

  const daysRemaining = useMemo(() => {
    if (!stats.mainTask?.targetDate) return null;
    const target = new Date(stats.mainTask.targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [stats.mainTask]);

  const growthData = useMemo(() => {
    const days = [];
    let cumulativeMomentum = 100; 
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const percentage = stats.dailyCompletion[iso] ?? 0;
      
      let delta = 0;
      if (percentage >= 100) delta = 15;
      else if (percentage >= 80) delta = 5;
      else if (percentage >= 50) delta = 0;
      else if (percentage > 0) delta = -8;
      else delta = -20;

      cumulativeMomentum += delta;
      days.push({ 
        name: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), 
        momentum: cumulativeMomentum,
        completion: percentage,
        dateObj: new Date(d)
      });
    }
    return days;
  }, [stats.dailyCompletion]);

  const getMasteryColor = (p: number) => {
    if (p === 0) return 'bg-gray-100 text-gray-400 border-gray-200';
    if (p === 100) return 'bg-green-500 text-white border-green-600 shadow-sm';
    if (p >= 80) return 'bg-yellow-400 text-white border-yellow-500 shadow-sm';
    if (p >= 50) return 'bg-blue-400 text-white border-blue-500 shadow-sm';
    return 'bg-red-400 text-white border-red-500 shadow-sm';
  };

  const jumpToDay = (date: Date) => {
    setSchedulerDate(date);
    setActiveTab(Tab.SCHEDULER);
  };

  const handleSaveMain = () => {
    if (mainName && mainDate) {
      setMainTask(mainName, mainDate);
      setIsEditingMain(false);
    }
  };

  const currentMomentumLevel = growthData[growthData.length - 1];

  return (
    <div className="tab-content h-full overflow-y-auto no-scrollbar px-4 space-y-6 pb-24">
      {/* Main Mission Header */}
      <div className="m3-card p-6 bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Primary Objective</span>
            </div>
            <button onClick={() => setIsEditingMain(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Edit3 size={16} />
            </button>
          </div>

          {stats.mainTask ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-black truncate">{stats.mainTask.name}</h2>
              <div className="flex items-end gap-4">
                <div className="flex flex-col">
                  <span className="text-4xl font-black text-yellow-400">{daysRemaining}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Days Remaining</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl mb-1">
                  <Clock size={14} className="text-blue-300" />
                  <span className="text-xs font-bold">{new Date(stats.mainTask.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm font-bold opacity-60 mb-4">No Primary Mission Set</p>
              <button 
                onClick={() => setIsEditingMain(true)}
                className="bg-white text-indigo-900 px-6 py-2 rounded-full font-black text-xs shadow-lg active:scale-95 transition-transform"
              >
                DEPLOY MAIN TASK
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Task Editor Modal */}
      {isEditingMain && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-6 text-indigo-600 text-center">Update Main Mission</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Mission Name</label>
                <input 
                  type="text" 
                  value={mainName}
                  onChange={(e) => setMainName(e.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none border border-gray-100 font-bold"
                  placeholder="e.g. Master React, Final Exams..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Target Date</label>
                <input 
                  type="date" 
                  value={mainDate}
                  onChange={(e) => setMainDate(e.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none border border-gray-100 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => setIsEditingMain(false)} className="bg-gray-100 py-4 rounded-2xl font-black text-gray-400 text-sm">Cancel</button>
                <button onClick={handleSaveMain} className="bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg">Save Mission</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Growth Slope Chart Card */}
      <div className="m3-card p-6 bg-white overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={18} className="text-green-500" />
          <h3 className="font-bold text-[#1C1B1F]">Momentum Slope</h3>
        </div>
        <div className="h-44 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={growthData}
              onClick={(data) => {
                if (data && data.activePayload) {
                  jumpToDay(data.activePayload[0].payload.dateObj);
                }
              }}
            >
              <defs>
                <linearGradient id="slopeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip 
                cursor={{ stroke: '#4f46e5', strokeWidth: 2 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
              />
              <Area type="monotone" dataKey="momentum" stroke="#4f46e5" strokeWidth={4} fill="url(#slopeGrad)" animationDuration={1500} strokeLinecap="round" cursor="pointer" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Galaxy Log Card - Day 1 to 365 */}
      <div className="m3-card p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
              <History size={18} />
            </div>
            <h3 className="font-bold text-[#1C1B1F] text-sm">Galaxy Log</h3>
          </div>
          <div className="bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase">
            365 Day Cycle
          </div>
        </div>
        <p className="text-[9px] font-black text-gray-400 uppercase mb-3 text-center tracking-tighter">Tap blocks to inspect missions</p>
        <div className="h-[400px] overflow-y-auto no-scrollbar pr-1 border-t border-gray-50 pt-4">
          <div className="grid grid-cols-7 gap-2">
            {fullYearLog.map((day) => (
              <button 
                key={day.iso} 
                onClick={() => jumpToDay(day.dateObj)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition-all active:scale-90 ${getMasteryColor(day.percentage)} ${day.isToday ? 'ring-4 ring-indigo-400 ring-offset-2' : ''}`}
              >
                <span className="text-[6px] font-black opacity-40 leading-none mb-1">D{day.dayIndex}</span>
                <span className="text-[10px] font-black leading-none">{day.percentage}%</span>
              </button>
            ))}
            <div ref={gridEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
