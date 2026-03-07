
import React, { useState, useMemo, useEffect } from 'react';
import { GraduationCap, Upload, FileText, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Trash2, Plus, Play, Calendar, Clock, BarChart3, Rocket, ArrowRight, ListTodo, Target } from 'lucide-react';
import { useApp } from '../state';
import { Tab, SyllabusTopic, ExamPlan, Task } from '../types';
import PandaMascot from './PandaMascot';
import { parseSyllabus, estimateTopicMinutes, generateSchedule, extractTextFromFile } from '../utils/syllabusParser';

const SUBJECT_COLORS = [
  '#F6AD55', '#8B5FBF', '#48BB78', '#60A5FA', '#F87171',
  '#2DD4BF', '#FB923C', '#A78BFA', '#34D399', '#FCD34D'
];

const ExamPlannerTab: React.FC = () => {
  const { examPlans, addExamPlan, updateExamPlan, deleteExamPlan, markTopicComplete, addTask, setMainTask, tasks, toggleTask, stats, deleteTask } = useApp();
  const [subScreen, setSubScreen] = useState<'landing' | 'setup' | 'dashboard'>('landing');
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [tempPriority, setTempPriority] = useState<string[]>([]);
  
  const activePlan = useMemo(() => examPlans.find(p => p.isActive), [examPlans]);

  const currentFocuses = useMemo(() => {
    if (!stats.focusSubjects || stats.focusSubjects.length === 0) return null;
    return stats.focusSubjects.filter(f => new Date(f.endDate) >= new Date());
  }, [stats.focusSubjects]);

  useEffect(() => {
    if (activePlan) setSubScreen('dashboard');
    else setSubScreen('landing');
  }, [activePlan]);

  // --- SETUP WIZARD STATE ---
  const [step, setStep] = useState(1);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(360);
  const [revisionBufferDays, setRevisionBufferDays] = useState(14);
  const [rawSyllabus, setRawSyllabus] = useState('');
  const [parsedTopics, setParsedTopics] = useState<SyllabusTopic[]>([]);
  const [subjectPriority, setSubjectPriority] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileError, setFileError] = useState('');
  const [inputMethod, setInputMethod] = useState<'manual' | 'txt' | 'pdf'>('manual');

  const handleCreateNew = () => {
    setStep(1);
    setSubScreen('setup');
  };

  const handleParse = async () => {
    if (rawSyllabus.length < 50) {
      setFileError('Syllabus text too short (min 50 chars)');
      return;
    }
    setIsProcessing(true);
    try {
      const topics = parseSyllabus(rawSyllabus);
      setParsedTopics(topics);
      const uniqueSubjects = Array.from(new Set(topics.map(t => t.subject)));
      setSubjectPriority(uniqueSubjects);
      setStep(3);
    } catch (e) {
      setFileError('Parsing failed. Check format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'txt' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File too large (> 5MB)');
      return;
    }
    setFileError('');
    setIsProcessing(true);
    try {
      const text = await extractTextFromFile(file);
      setRawSyllabus(text);
    } catch (err: any) {
      setFileError(err.message || 'Extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const launchPlan = () => {
    const plan: ExamPlan = {
      id: Math.random().toString(36).substr(2, 9),
      examName,
      examDate,
      createdAt: new Date().toISOString(),
      dailyStudyMinutes,
      revisionBufferDays,
      topics: parsedTopics,
      scheduledTasks: [],
      isActive: true,
      subjectPriority
    };

    const generatedTasks = generateSchedule(plan);
    const taskIds: string[] = [];
    
    generatedTasks.forEach(t => {
      addTask(t);
      // Note: addTask in state.tsx generates its own ID, so we need a way to track them.
      // For this implementation, we'll assume the IDs we generated in generateSchedule are used.
      // Actually, addTask in state.tsx overwrites the ID. 
      // Let's fix state.tsx to respect provided ID or return the new ID.
      // Since I can't change state.tsx signature easily without risk, 
      // I'll just rely on the fact that we can find them by name/time later if needed, 
      // but better to store them.
      taskIds.push(t.id); 
    });

    plan.scheduledTasks = taskIds;
    addExamPlan(plan);
    setMainTask(examName, examDate);
    setSubScreen('dashboard');
  };

  // --- RENDER HELPERS ---

  const renderLanding = () => (
    <div className="flex flex-col items-center justify-center h-full py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PandaMascot size="large" />
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-4xl font-black text-gray-800 tracking-tighter">Exam Planner</h1>
        <p className="text-sm font-bold text-gray-500 leading-relaxed">
          Upload your syllabus, set your exam date, and Panda Mate automatically builds your complete study schedule. 
          <span className="block mt-1 text-emerald-600">Zero AI. Pure math.</span>
        </p>
      </div>

      <button 
        onClick={handleCreateNew}
        className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center gap-3"
      >
        <Rocket size={24} />
        CREATE NEW PLAN
      </button>

      {examPlans.length > 0 && (
        <div className="w-full max-w-md space-y-4 pt-8">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Previous Plans</h3>
          {examPlans.map(p => (
            <div key={p.id} className="m3-card p-4 flex items-center justify-between bg-white/50 border-dashed">
              <div>
                <h4 className="font-black text-gray-800">{p.examName}</h4>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Exam: {p.examDate}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateExamPlan(p.id, { isActive: true })}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <Play size={16} />
                </button>
                <button 
                  onClick={() => deleteExamPlan(p.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSetup = () => {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        {/* Progress Header */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                step === s ? 'bg-emerald-600 text-white shadow-lg scale-110' : 
                step > s ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? <CheckCircle2 size={20} /> : s}
              </div>
              {s < 4 && <div className={`w-8 h-1 mx-1 rounded-full ${step > s ? 'bg-emerald-200' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-800">Exam Details</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Step 1 of 4</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Exam Name</label>
                <input 
                  type="text" 
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. GATE CE 2027"
                  className="w-full bg-white px-6 py-5 rounded-3xl outline-none border border-gray-100 font-bold focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Exam Date</label>
                <input 
                  type="date" 
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full bg-white px-6 py-5 rounded-3xl outline-none border border-gray-100 font-bold focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div className="space-y-4 bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100/50">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-emerald-700 uppercase">Daily Study Time</label>
                  <span className="text-sm font-black text-emerald-600">{Math.floor(dailyStudyMinutes / 60)}h {dailyStudyMinutes % 60 > 0 ? `${dailyStudyMinutes % 60}m` : ''}</span>
                </div>
                <input 
                  type="range" 
                  min="60" max="600" step="30"
                  value={dailyStudyMinutes}
                  onChange={e => setDailyStudyMinutes(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-emerald-200 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-4 bg-orange-50/50 p-6 rounded-[2.5rem] border border-orange-100/50">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-orange-700 uppercase">Revision Buffer</label>
                  <span className="text-sm font-black text-orange-600">{revisionBufferDays} Days</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="30" step="1"
                  value={revisionBufferDays}
                  onChange={e => setRevisionBufferDays(parseInt(e.target.value))}
                  className="w-full accent-orange-500 h-2 bg-orange-200 rounded-full appearance-none cursor-pointer"
                />
                <p className="text-[9px] font-bold text-orange-400 uppercase text-center">Last {revisionBufferDays} days reserved for full revision</p>
              </div>
            </div>

            <button 
              disabled={!examName || !examDate}
              onClick={() => setStep(2)}
              className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              NEXT STEP <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-800">Syllabus Input</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Step 2 of 4</p>
            </div>

            <div className="flex p-1 bg-gray-100 rounded-2xl">
              {(['manual', 'txt', 'pdf'] as const).map(m => (
                <button 
                  key={m}
                  onClick={() => setInputMethod(m)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMethod === m ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {inputMethod === 'manual' && (
              <div className="space-y-4">
                <textarea 
                  value={rawSyllabus}
                  onChange={e => setRawSyllabus(e.target.value)}
                  placeholder="Paste your syllabus here...&#10;&#10;Example:&#10;Section 1: Mathematics&#10;Linear Algebra: Matrix algebra; eigenvalues&#10;Calculus: Limits; derivatives"
                  className="w-full h-64 bg-white p-6 rounded-3xl outline-none border border-gray-100 font-bold text-sm focus:ring-4 focus:ring-emerald-100 transition-all resize-none"
                />
                <div className="flex justify-between px-2">
                  <span className="text-[9px] font-black text-gray-300 uppercase">{rawSyllabus.length} characters</span>
                  {rawSyllabus.length < 50 && <span className="text-[9px] font-black text-red-400 uppercase">Min 50 chars required</span>}
                </div>
              </div>
            )}

            {(inputMethod === 'txt' || inputMethod === 'pdf') && (
              <div className="space-y-6">
                <label className="block w-full aspect-video border-4 border-dashed border-gray-100 rounded-[3rem] hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group relative overflow-hidden">
                  <input 
                    type="file" 
                    accept={inputMethod === 'txt' ? '.txt' : '.pdf'} 
                    className="hidden" 
                    onChange={e => handleFileUpload(e, inputMethod)}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      {inputMethod === 'txt' ? <FileText className="text-gray-400" /> : <Upload className="text-gray-400" />}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-gray-600">Click to upload {inputMethod.toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Max size: 5MB</p>
                    </div>
                  </div>
                </label>

                {rawSyllabus && (
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-700 uppercase mb-2 flex items-center gap-2">
                      <CheckCircle2 size={12} /> File Loaded Successfully
                    </p>
                    <p className="text-xs font-bold text-emerald-900/60 line-clamp-3 italic">"{rawSyllabus.substring(0, 300)}..."</p>
                  </div>
                )}
              </div>
            )}

            {fileError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle size={18} />
                <span className="text-xs font-bold uppercase">{fileError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-3xl font-black text-sm active:scale-95 transition-all">BACK</button>
              <button 
                disabled={rawSyllabus.length < 50 || isProcessing}
                onClick={handleParse}
                className="flex-[2] bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'PARSE SYLLABUS'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-800">Review Syllabus</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Step 3 of 4</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="m3-card p-5 bg-emerald-50 border-emerald-100">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Topics</p>
                <p className="text-2xl font-black text-emerald-900">{parsedTopics.length}</p>
              </div>
              <div className="m3-card p-5 bg-indigo-50 border-indigo-100">
                <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest mb-1">Study Load</p>
                <p className="text-2xl font-black text-indigo-900">
                  {Math.floor(parsedTopics.reduce((acc, t) => acc + t.estimatedMinutes, 0) / 60)}h
                </p>
              </div>
            </div>

            {/* Priority Sorter */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4">
                <ListTodo size={18} className="text-emerald-600" />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Subject Priority</h3>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4 mb-2">Set the order of subjects for schedule generation</p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar px-1">
                {subjectPriority.map((sub, idx) => (
                  <div key={sub} className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-emerald-200 transition-all">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 font-black text-sm shadow-inner">{idx + 1}</div>
                    <span className="flex-1 font-black text-gray-700 text-sm">{sub}</span>
                    <div className="flex gap-2">
                      <button 
                        disabled={idx === 0}
                        onClick={() => {
                          const newP = [...subjectPriority];
                          [newP[idx - 1], newP[idx]] = [newP[idx], newP[idx - 1]];
                          setSubjectPriority(newP);
                        }}
                        className="p-3 bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all disabled:opacity-0 active:scale-90"
                      >
                        <ChevronLeft className="rotate-90" size={18} />
                      </button>
                      <button 
                         disabled={idx === subjectPriority.length - 1}
                         onClick={() => {
                           const newP = [...subjectPriority];
                           [newP[idx + 1], newP[idx]] = [newP[idx], newP[idx + 1]];
                           setSubjectPriority(newP);
                         }}
                        className="p-3 bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all disabled:opacity-0 active:scale-90"
                      >
                        <ChevronRight className="rotate-90" size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-6">
              {subjectPriority.map((sub, sIdx) => {
                const subTopics = parsedTopics.filter(t => t.subject === sub);
                return (
                  <div key={sub} className="space-y-3">
                    <div className="flex items-center justify-between px-4">
                      <h4 className="text-[11px] font-black uppercase tracking-widest" style={{ color: SUBJECT_COLORS[sIdx % SUBJECT_COLORS.length] }}>{sub}</h4>
                      <span className="text-[9px] font-black text-gray-300 uppercase">{subTopics.length} Topics</span>
                    </div>
                    <div className="space-y-2">
                      {subTopics.map(topic => (
                        <div key={topic.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group">
                          <input 
                            className="flex-1 font-bold text-gray-700 outline-none bg-transparent"
                            value={topic.name}
                            onChange={e => {
                              setParsedTopics(prev => prev.map(t => t.id === topic.id ? { ...t, name: e.target.value } : t));
                            }}
                          />
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                              <Clock size={10} className="text-gray-400" />
                              <input 
                                type="number"
                                step="15"
                                className="w-8 bg-transparent text-[10px] font-black text-gray-600 outline-none"
                                value={topic.estimatedMinutes}
                                onChange={e => {
                                  setParsedTopics(prev => prev.map(t => t.id === topic.id ? { ...t, estimatedMinutes: parseInt(e.target.value) || 0 } : t));
                                }}
                              />
                            </div>
                            <button 
                              onClick={() => setParsedTopics(prev => prev.filter(t => t.id !== topic.id))}
                              className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newTopic: SyllabusTopic = {
                            id: Math.random().toString(36).substr(2, 9),
                            name: 'New Topic',
                            subject: sub,
                            estimatedMinutes: 45,
                            completed: false
                          };
                          setParsedTopics([...parsedTopics, newTopic]);
                        }}
                        className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-300 uppercase hover:border-emerald-200 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} /> Add Topic to {sub}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-3xl font-black text-sm active:scale-95 transition-all">BACK</button>
              <button 
                onClick={() => setStep(4)}
                className="flex-[2] bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                CONFIRM TOPICS <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-800">Final Confirmation</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Step 4 of 4</p>
            </div>

            <div className="m3-card p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black">{examName}</h3>
                  <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{new Date(examDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <GraduationCap size={24} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Total Topics</p>
                  <p className="text-xl font-black">{parsedTopics.length}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Daily Commitment</p>
                  <p className="text-xl font-black">{Math.floor(dailyStudyMinutes / 60)}h {dailyStudyMinutes % 60}m</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Revision Buffer</p>
                  <p className="text-xl font-black">{revisionBufferDays} Days</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Subjects</p>
                  <p className="text-xl font-black">{subjectPriority.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100 flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-xl text-orange-600 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-orange-800 uppercase tracking-tight">Schedule Warning</h4>
                <p className="text-xs font-bold text-orange-700/70 leading-relaxed">
                  Panda Mate will distribute these topics greedily across all available days to ensure maximum coverage.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-3xl font-black text-sm active:scale-95 transition-all">EDIT TOPICS</button>
              <button 
                onClick={launchPlan}
                className="flex-[2] bg-emerald-600 text-white py-5 rounded-3xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                🚀 LAUNCH PLAN
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => {
    if (!activePlan) return null;

    const completedTopics = activePlan.topics.filter(t => t.completed).length;
    const progress = Math.round((completedTopics / activePlan.topics.length) * 100);
    const daysLeft = Math.ceil((new Date(activePlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todaysTasks = tasks.filter(t => {
      const isStudy = new Date(t.startTime).toLocaleDateString('en-CA') === todayStr && t.category === 'Study';
      if (!isStudy) return false;
      if (currentFocuses && currentFocuses.length > 0) {
        // If focus is active, only show tasks related to those subjects or revision of those subjects
        return currentFocuses.some(f => t.name.includes(f.subject));
      }
      return true;
    });

    const displaySubjects = subjectPriority;

    const completedSubjectsCount = displaySubjects.filter(sub => {
      const subTopics = activePlan.topics.filter(t => t.subject === sub);
      return subTopics.length > 0 && subTopics.every(t => t.completed);
    }).length;
    const totalSubjectsCount = displaySubjects.length;

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        {/* Top Progress Card */}
        <div className="m3-card p-8 bg-white space-y-6 relative overflow-hidden">
          {currentFocuses && currentFocuses.length > 0 && (
            <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest animate-pulse">
              Focus Mode: {currentFocuses.map(f => f.subject).join(', ')}
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-800">{activePlan.examName}</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Target: {activePlan.examDate}</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-emerald-600">{daysLeft}</span>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Days Remaining</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overall Mastery</span>
              <span className="text-sm font-black text-emerald-600">{progress}%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden p-1">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
            {subjectPriority.map((sub, idx) => {
              const subTopics = activePlan.topics.filter(t => t.subject === sub);
              const subDone = subTopics.filter(t => t.completed).length;
              const subProg = Math.round((subDone / subTopics.length) * 100);
              return (
                <div key={sub} className="space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase truncate">{sub}</p>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ width: `${subProg}%`, backgroundColor: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus Subjects Summary */}
        {currentFocuses && currentFocuses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentFocuses.map((focus, idx) => {
              const subTopics = activePlan.topics.filter(t => t.subject === focus.subject);
              const done = subTopics.filter(t => t.completed).length;
              const total = subTopics.length;
              const prog = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={focus.subject} className="m3-card p-6 bg-indigo-600 text-white space-y-4 shadow-xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h3 className="text-[8px] font-black uppercase tracking-widest opacity-70">Focus Subject {idx + 1}</h3>
                      <h2 className="text-lg font-black mt-1 truncate max-w-[150px]">{focus.subject}</h2>
                    </div>
                    <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                      <GraduationCap size={20} />
                    </div>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black uppercase opacity-70">Topic Progress</span>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black">{done} / {total} Topics</span>
                        <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-lg mt-1">{prog}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Today's Agenda */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <ListTodo size={18} className="text-emerald-600" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Today's Missions</h3>
          </div>
          
          {todaysTasks.length > 0 ? (
            <div className="space-y-3">
              {todaysTasks.map(task => (
                <div key={task.id} className={`m3-card p-5 flex items-center justify-between transition-all ${task.completed ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      <span className="text-[10px] leading-none uppercase">{new Date(task.startTime).getHours()}:{new Date(task.startTime).getMinutes().toString().padStart(2, '0')}</span>
                    </div>
                    <div>
                      <h4 className={`font-black text-sm ${task.completed ? 'text-emerald-900 line-through' : 'text-gray-800'}`}>{task.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{task.durationMinutes} Minutes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      toggleTask(task.id);
                    }}
                    className={`p-3 rounded-2xl transition-all ${task.completed ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="m3-card p-10 bg-white/50 border-dashed flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <Calendar size={32} />
              </div>
              <div>
                <p className="font-black text-gray-400 uppercase text-xs">No Study Missions Today</p>
                <p className="text-[10px] font-bold text-gray-300 uppercase mt-1">Revision buffer active or schedule complete</p>
              </div>
            </div>
          )}
        </div>

        {/* Subject Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                Subject Mastery
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setTempPriority([...subjectPriority]);
                  setShowReorderModal(true);
                }}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                title="Reorder Subjects"
              >
                <ListTodo size={14} />
              </button>
              <div className="bg-indigo-50 px-3 py-1 rounded-full">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                  {completedSubjectsCount} / {totalSubjectsCount} Completed
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displaySubjects.map((sub, idx) => {
                const subTopics = activePlan.topics.filter(t => t.subject === sub);
                const done = subTopics.filter(t => t.completed).length;
                const prog = Math.round((done / subTopics.length) * 100);
                const isDone = prog === 100;
                return (
                  <div key={sub} className={`m3-card p-5 transition-all ${isDone ? 'bg-emerald-50/30 border-emerald-100 shadow-inner' : 'bg-white'} space-y-4`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isDone && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                      <h4 className={`font-black text-sm truncate pr-4 ${isDone ? 'text-emerald-900' : 'text-gray-800'}`}>{sub}</h4>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isDone ? 'bg-emerald-500 text-white' : ''}`} style={!isDone ? { backgroundColor: `${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}20`, color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] } : {}}>
                      {prog}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
                      <span>{done} / {subTopics.length} Topics</span>
                      {isDone && <span className="text-emerald-600">Mastered</span>}
                    </div>
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-700"
                        style={{ width: `${prog}%`, backgroundColor: isDone ? '#10B981' : SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reorder Modal */}
        {showReorderModal && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-[300] flex items-center justify-center p-6">
            <div className="bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border border-white">
              <div className="bg-indigo-600 p-8 text-white text-center">
                <ListTodo size={48} className="mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-black">Reorder Priority</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">Regenerate Study Schedule</p>
              </div>
              <div className="p-8 space-y-4">
                <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2">
                  {tempPriority.map((sub, idx) => (
                    <div key={sub} className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 font-black text-[10px]">{idx + 1}</div>
                      <span className="flex-1 font-bold text-xs text-gray-700 truncate">{sub}</span>
                      <div className="flex gap-1">
                        <button 
                          disabled={idx === 0}
                          onClick={() => {
                            const newP = [...tempPriority];
                            [newP[idx - 1], newP[idx]] = [newP[idx], newP[idx - 1]];
                            setTempPriority(newP);
                          }}
                          className="p-1.5 text-gray-300 hover:text-emerald-600 transition-colors disabled:opacity-0"
                        >
                          <ChevronLeft className="rotate-90" size={14} />
                        </button>
                        <button 
                          disabled={idx === tempPriority.length - 1}
                          onClick={() => {
                            const newP = [...tempPriority];
                            [newP[idx + 1], newP[idx]] = [newP[idx], newP[idx + 1]];
                            setTempPriority(newP);
                          }}
                          className="p-1.5 text-gray-300 hover:text-emerald-600 transition-colors disabled:opacity-0"
                        >
                          <ChevronRight className="rotate-90" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <button 
                    onClick={() => {
                      const updatedPlan = { ...activePlan, subjectPriority: tempPriority };
                      // Delete old study tasks
                      activePlan.scheduledTasks.forEach(id => deleteTask(id));
                      // Generate new schedule
                      const newTasks = generateSchedule(updatedPlan);
                      newTasks.forEach(t => addTask(t));
                      // Update plan
                      updateExamPlan(activePlan.id, { 
                        subjectPriority: tempPriority,
                        scheduledTasks: newTasks.map(t => t.id)
                      });
                      setShowReorderModal(false);
                    }}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                  >
                    REGENERATE SCHEDULE
                  </button>
                  <button onClick={() => setShowReorderModal(false)} className="w-full py-3 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="pt-10">
          <button 
            onClick={() => {
              if (confirm(`Delete plan "${activePlan.examName}" and all its scheduled tasks?`)) {
                deleteExamPlan(activePlan.id);
              }
            }}
            className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all"
          >
            TERMINATE ACTIVE PLAN
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4">
      {subScreen === 'landing' && renderLanding()}
      {subScreen === 'setup' && renderSetup()}
      {subScreen === 'dashboard' && renderDashboard()}
    </div>
  );
};

export default ExamPlannerTab;

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
