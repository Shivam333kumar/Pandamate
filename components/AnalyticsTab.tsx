
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell, ReferenceArea } from 'recharts';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, Zap, History, ArrowUpRight, ArrowDownRight, Minus, MousePointer2, Target, Trophy, Clock, Edit3, AlertCircle } from 'lucide-react';
import { useApp } from '../state';
import { Tab, Task } from '../types';

const AnalyticsTab: React.FC = () => {
  const { tasks, stats, setActiveTab, setSchedulerDate, setMainTask, startDate, sleepConfig } = useApp();
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [mainName, setMainName] = useState(stats.mainTask?.name || '');
  const [mainDate, setMainDate] = useState(stats.mainTask?.targetDate || '');
  const gridEndRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-CA');
  }, []);

  const fullYearLog = useMemo(() => {
    const days = [];
    const start = new Date(startDate);
    const now = new Date();
    
    // We want a 365-day log, but starting from Day 1 (the start date)
    // If the start date was more than 365 days ago, we show the last 365.
    // Otherwise, we show from Day 1 to at least Today.
    let displayStart = new Date(start);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      displayStart = new Date(now);
      displayStart.setDate(now.getDate() - 364);
    }

    // Always ensure we have at least 365 slots to maintain the "Galaxy" look
    const totalDaysToShow = Math.max(365, diffDays + 7); 
    const logStart = new Date(displayStart);

    for (let i = 0; i < totalDaysToShow; i++) {
      const d = new Date(logStart);
      d.setDate(logStart.getDate() + i);
      const iso = d.toLocaleDateString('en-CA');
      const percentage = stats.dailyCompletion[iso] ?? 0;
      
      // Calculate day index relative to the absolute start date
      const relativeDayIndex = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      days.push({ 
        iso, 
        percentage, 
        dateObj: new Date(d),
        dayIndex: relativeDayIndex,
        isToday: iso === todayStr,
        isFuture: d > now
      });
    }
    return days;
  }, [stats.dailyCompletion, todayStr, startDate]);

  const daysRemaining = useMemo(() => {
    if (!stats.mainTask?.targetDate) return null;
    const target = new Date(stats.mainTask.targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [stats.mainTask]);

  const growthData = useMemo(() => {
    const days: any[] = [];
    let mindMomentum = 50;
    let bodyMomentum = 50;
    let studyMomentum = 50;
    let overallMomentum = 50;
    
    // Group tasks by date for efficiency
    const tasksByDate = tasks.reduce((acc, task) => {
      const date = new Date(task.startTime).toLocaleDateString('en-CA');
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    const getDelta = (completedMins: number, totalMins: number, categoryOffset: number) => {
      if (totalMins === 0) return -8 + categoryOffset;
      
      const p = (completedMins / totalMins) * 100;
      
      // 1. Consistency Factor (Percentage based)
      // 100% -> +5, 50% -> 0, 0% -> -10
      const consistency = (p - 50) * 0.1;
      
      // 2. Volume Factor (Duration based)
      // Every hour completed adds 3 points
      const volume = (completedMins / 60) * 3;
      
      // 3. Penalty Factor (Missed duration)
      // Every hour missed subtracts 4 points
      const missedMins = totalMins - completedMins;
      const penalty = (missedMins / 60) * 4;
      
      // Base delta
      let delta = consistency + volume - penalty;
      
      // Clamp delta to reasonable range per day
      delta = Math.min(20, Math.max(-25, delta));
      
      return delta + categoryOffset;
    };

    const getStats = (taskList: Task[] = []) => {
      const total = taskList.reduce((acc, t) => acc + t.durationMinutes, 0);
      const completed = taskList.filter(t => t.completed).reduce((acc, t) => acc + t.durationMinutes, 0);
      return { total, completed };
    };

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toLocaleDateString('en-CA');
      
      const dayTasks = tasksByDate[iso] || [];
      
      const mindData = getStats(dayTasks.filter(t => t.category === 'Mind'));
      const bodyData = getStats(dayTasks.filter(t => t.category === 'Body'));
      const studyData = getStats(dayTasks.filter(t => t.category === 'Study'));
      const totalData = getStats(dayTasks);

      // Unique offsets (0.01, 0.02, 0.03, 0.04) ensure curves never perfectly overlap
      const mindDelta = getDelta(mindData.completed, mindData.total, 0.01);
      const bodyDelta = getDelta(bodyData.completed, bodyData.total, 0.02);
      const studyDelta = getDelta(studyData.completed, studyData.total, 0.03);
      const overallDelta = getDelta(totalData.completed, totalData.total, 0.04);

      mindMomentum = Math.min(100, Math.max(5, mindMomentum + mindDelta));
      bodyMomentum = Math.min(100, Math.max(5, bodyMomentum + bodyDelta));
      studyMomentum = Math.min(100, Math.max(5, studyMomentum + studyDelta));
      overallMomentum = Math.min(100, Math.max(5, overallMomentum + overallDelta));
      
      const prevOverall = days.length > 0 ? days[days.length - 1].momentum : overallMomentum;
      
      let trend = 'STABLE';
      let color = '#94a3b8';
      if (overallMomentum > prevOverall) { trend = 'GROWING'; color = '#22c55e'; }
      else if (overallMomentum < prevOverall) { trend = 'DECLINING'; color = '#ef4444'; }

      days.push({ 
        name: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), 
        mind: mindMomentum,
        body: bodyMomentum,
        study: studyMomentum,
        momentum: overallMomentum,
        // Using raw values now as offsets are built into the momentum calculation
        mindDisp: mindMomentum,
        bodyDisp: bodyMomentum,
        studyDisp: studyMomentum,
        momentumDisp: overallMomentum,
        mindDelta,
        bodyDelta,
        studyDelta,
        overallDelta: overallMomentum - prevOverall,
        trend,
        color,
        isDecayed: dayTasks.length === 0,
        dateObj: new Date(d)
      });
    }
    return days;
  }, [tasks]);

  const timeAllocation = useMemo(() => {
    const now = new Date();
    const isoToday = now.toLocaleDateString('en-CA');
    const todayTasks = tasks.filter(t => new Date(t.startTime).toLocaleDateString('en-CA') === isoToday);

    const allocation: Record<string, { total: number, completed: number }> = {
      Mind: { total: 0, completed: 0 },
      Body: { total: 0, completed: 0 },
      Study: { total: 0, completed: 0 },
      Break: { total: 0, completed: 0 },
      Sleep: { total: sleepConfig.duration * 60, completed: 0 },
      Medicine: { total: 0, completed: 0 },
    };

    todayTasks.forEach(t => {
      if (allocation[t.category] !== undefined) {
        allocation[t.category].total += t.durationMinutes;
        if (t.completed) {
          allocation[t.category].completed += t.durationMinutes;
        }
      }
    });

    // Special case for sleep: if it's past wake time, consider it "completed" for the chart
    const [bh, bm] = sleepConfig.bedtime.split(':').map(Number);
    const bedtimeDate = new Date(now);
    bedtimeDate.setHours(bh, bm, 0, 0);
    const wakeDate = new Date(bedtimeDate);
    wakeDate.setMinutes(wakeDate.getMinutes() + sleepConfig.duration * 60);
    if (now > wakeDate) {
      allocation.Sleep.completed = allocation.Sleep.total;
    } else if (now > bedtimeDate) {
      const diffMs = now.getTime() - bedtimeDate.getTime();
      allocation.Sleep.completed = Math.min(allocation.Sleep.total, Math.floor(diffMs / 60000));
    }

    const totalPlanned = Object.values(allocation).reduce((a, b) => a + b.total, 0);
    const freeTime = Math.max(0, 1440 - totalPlanned);

    return [
      { name: 'Mind', value: allocation.Mind.total, completed: allocation.Mind.completed, color: '#8B5FBF' },
      { name: 'Body', value: allocation.Body.total, completed: allocation.Body.completed, color: '#48BB78' },
      { name: 'Study', value: allocation.Study.total, completed: allocation.Study.completed, color: '#F6AD55' },
      { name: 'Sleep', value: allocation.Sleep.total, completed: allocation.Sleep.completed, color: '#4FD1C7' },
      { name: 'Break', value: allocation.Break.total, completed: allocation.Break.completed, color: '#CBD5E0' },
      { name: 'Free', value: freeTime, completed: freeTime, color: '#E2E8F0' },
    ].filter(item => item.value > 0);
  }, [tasks, sleepConfig]);

  const getMasteryColor = (p: number, isFuture: boolean) => {
    if (isFuture) return 'bg-gray-50 text-gray-200 border-gray-100 opacity-30 cursor-not-allowed';
    if (p === 0) return 'bg-gray-100 text-gray-400 border-gray-200';
    if (p === 100) return 'bg-gradient-to-br from-green-400 to-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-100';
    if (p >= 80) return 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white border-amber-600 shadow-lg shadow-amber-100';
    if (p >= 50) return 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100';
    return 'bg-gradient-to-br from-red-400 to-rose-600 text-white border-rose-700 shadow-lg shadow-rose-100';
  };

  const jumpToDay = (date: Date) => {
    const now = new Date();
    if (date > now) return;
    setSchedulerDate(date);
    setActiveTab(Tab.SCHEDULER);
  };

  const handleSaveMain = () => {
    if (mainName && mainDate) {
      setMainTask(mainName, mainDate);
      setIsEditingMain(false);
    }
  };

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-green-500" />
            <h3 className="font-bold text-[#1C1B1F]">Momentum Slope</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
            growthData[growthData.length-1].trend === 'GROWING' ? 'bg-green-100 text-green-600' :
            growthData[growthData.length-1].trend === 'DECLINING' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
          }`}>
            {growthData[growthData.length-1].trend === 'GROWING' ? '▲' : growthData[growthData.length-1].trend === 'DECLINING' ? '▼' : '●'} 
            {growthData[growthData.length-1].trend}
          </div>
        </div>

        {growthData.some(d => d.isDecayed) && (
          <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-[10px] font-bold text-red-600 animate-pulse">
            <AlertCircle size={12} />
            <span>No tasks logged — curves auto-decaying (−8pts/day)</span>
          </div>
        )}

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
                <linearGradient id="overallGrad" x1="0" y1="0" x2="1" y2="0">
                  {growthData.map((entry, index) => {
                    if (index === 0) return null;
                    const prevEntry = growthData[index - 1];
                    const color = entry.momentum > prevEntry.momentum ? '#22c55e' : (entry.momentum < prevEntry.momentum ? '#ef4444' : '#94a3b8');
                    const startPos = ((index - 1) / (growthData.length - 1)) * 100;
                    const endPos = (index / (growthData.length - 1)) * 100;
                    return (
                      <React.Fragment key={index}>
                        <stop offset={`${startPos}%`} stopColor={color} />
                        <stop offset={`${endPos}%`} stopColor={color} />
                      </React.Fragment>
                    );
                  })}
                </linearGradient>
                <linearGradient id="mindGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 8, fontWeight: 'bold', fill: '#cbd5e1' }} 
                width={30} 
                domain={[0, 100]}
              />
              <Tooltip 
                cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataEntry = growthData.find(d => d.name === label);
                    return (
                      <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">{label}</p>
                        <div className="space-y-1.5">
                          {payload.map((item: any) => {
                            let direction = '●';
                            if (item.name === 'Mind') direction = (dataEntry?.mindDelta ?? 0) > 0 ? '↑' : ((dataEntry?.mindDelta ?? 0) < 0 ? '↓' : '●');
                            if (item.name === 'Body') direction = (dataEntry?.bodyDelta ?? 0) > 0 ? '↑' : ((dataEntry?.bodyDelta ?? 0) < 0 ? '↓' : '●');
                            if (item.name === 'Study') direction = (dataEntry?.studyDelta ?? 0) > 0 ? '↑' : ((dataEntry?.studyDelta ?? 0) < 0 ? '↓' : '●');
                            if (item.name === 'Overall') direction = (dataEntry?.overallDelta ?? 0) > 0 ? '↑' : ((dataEntry?.overallDelta ?? 0) < 0 ? '↓' : '●');
                            
                            return (
                              <div key={item.name} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-[11px] font-black text-gray-600">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-black text-gray-800">{Math.round(item.value)}</span>
                                  <span className="text-[10px] font-bold" style={{ color: item.color }}>{direction}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                height={36} 
                iconType="circle" 
                wrapperStyle={{ 
                  fontSize: '9px', 
                  fontWeight: '900', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  paddingBottom: '10px'
                }} 
              />
              {growthData.map((day, idx) => day.isDecayed ? (
                <ReferenceArea key={idx} x1={day.name} x2={day.name} fill="#fee2e2" fillOpacity={0.3} />
              ) : null)}
              <Area name="Mind" type="monotone" dataKey="mindDisp" stroke="#a78bfa" strokeWidth={2} fill="url(#mindGrad)" animationDuration={1000} dot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area name="Body" type="monotone" dataKey="bodyDisp" stroke="#34d399" strokeWidth={2} strokeDasharray="6 3" fill="url(#bodyGrad)" animationDuration={1000} dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area name="Study" type="monotone" dataKey="studyDisp" stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 5" fill="url(#studyGrad)" animationDuration={1000} dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area name="Overall" type="monotone" dataKey="momentumDisp" stroke="url(#overallGrad)" strokeWidth={2.8} fill="url(#overallGrad)" fillOpacity={0.08} animationDuration={1000} strokeLinecap="round" cursor="pointer" dot={{ r: 3.5, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Allocation Card */}
      <div className="m3-card p-6 bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-black text-[#1C1B1F] text-sm uppercase tracking-tight">Time Allocation</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Daily Resource Distribution</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-indigo-600">24h</span>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Cycle</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="relative h-56 w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {timeAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    const item = props.payload;
                    return [`${Math.round((item.completed / 60) * 10) / 10} / ${Math.round((item.value / 60) * 10) / 10} hours`, 'Progress'];
                  }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-800">100%</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Allocated</span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {timeAllocation.map((item) => (
              <div key={item.name} className="group p-4 rounded-3xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-400">{Math.round((item.value / 1440) * 100)}%</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-gray-800">{Math.round((item.completed / 60) * 10) / 10}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">/ {Math.round((item.value / 60) * 10) / 10} hrs</span>
                  </div>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 relative" 
                      style={{ 
                        width: `${(item.completed / item.value) * 100}%`,
                        backgroundColor: item.color 
                      }} 
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Galaxy Log Card - Starting from Day 1 */}
      <div className="m3-card p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
              <History size={18} />
            </div>
            <h3 className="font-bold text-[#1C1B1F] text-sm">Galaxy Log</h3>
          </div>
          <div className="bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase">
            Lifelong Training
          </div>
        </div>
        <p className="text-[9px] font-black text-gray-400 uppercase mb-3 text-center tracking-tighter">Day 1 started on {new Date(startDate).toLocaleDateString()}</p>
        <div className="h-[400px] overflow-y-auto no-scrollbar pr-1 border-t border-gray-50 pt-4">
          <div className="grid grid-cols-7 gap-2">
            {fullYearLog.map((day) => (
              <button 
                key={day.iso} 
                disabled={day.isFuture}
                onClick={() => jumpToDay(day.dateObj)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition-all active:scale-90 ${getMasteryColor(day.percentage, day.isFuture)} ${day.isToday ? 'ring-4 ring-indigo-400 ring-offset-2' : ''}`}
              >
                <span className="text-[6px] font-black opacity-40 leading-none mb-1">D{day.dayIndex}</span>
                {!day.isFuture && <span className="text-[10px] font-black leading-none">{day.percentage}%</span>}
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
