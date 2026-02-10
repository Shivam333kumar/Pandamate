
import React from 'react';
import { useApp } from '../state';
import { RefreshCw, Calendar, Clock, ChevronRight, BrainCircuit, Target, CheckCircle2 } from 'lucide-react';
import { CATEGORY_COLORS } from '../types';

const SpacedTab: React.FC = () => {
  const { tasks } = useApp();

  const activeSpacedTasks = tasks
    .filter(t => t.isSpacedRepetition && !t.completed)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const completedSpacedTasks = tasks
    .filter(t => t.isSpacedRepetition && t.completed)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="tab-content h-full overflow-y-auto no-scrollbar space-y-6 px-4 pb-24">
      <div className="pt-4">
        <h2 className="text-3xl font-black text-[#1C1B1F] tracking-tight">Mastery Roadmap</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Scientific Review Protocol (1-3-7-11 Days)</p>
      </div>

      {/* Active Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit size={18} className="text-indigo-600" />
          <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider">Active Missions</h3>
        </div>
        
        {activeSpacedTasks.length > 0 ? (
          activeSpacedTasks.map(task => {
            const taskDate = new Date(task.startTime);
            const dateStr = taskDate.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const progress = (task.repetitionStep || 0) / 4 * 100;

            return (
              <div key={task.id} className={`m3-card p-6 border-2 transition-all ${isToday ? 'border-indigo-500 bg-indigo-50/30' : 'border-white'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: CATEGORY_COLORS[task.category] }}>
                      <RefreshCw size={24} className={isToday ? 'animate-spin-slow' : ''} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#1C1B1F] text-[15px] leading-tight mb-1">{task.name}</h4>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black bg-white/60 px-2 py-0.5 rounded-lg text-gray-500 uppercase">Step {task.repetitionStep}/4</span>
                         <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 uppercase"><Clock size={10} /> {taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  {isToday && <div className="bg-indigo-600 text-white p-2 rounded-xl animate-bounce shadow-lg shadow-indigo-100"><ChevronRight size={18} /></div>}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <span>Mastery Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className={isToday ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className={`text-[11px] font-black uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {isToday ? 'DEPLOY NOW' : taskDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200">
            <Target size={40} className="text-gray-200 mb-3" />
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">No Active Roadmaps</p>
          </div>
        )}
      </div>

      {/* Mastery Logs */}
      {completedSpacedTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-600" />
            <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider">Completed Logs</h3>
          </div>
          <div className="space-y-3">
            {completedSpacedTasks.map(task => (
              <div key={task.id} className="bg-white/60 p-4 rounded-2xl border border-white flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: CATEGORY_COLORS[task.category] }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-xs font-black text-gray-700">{task.name}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{new Date(task.startTime).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacedTab;
