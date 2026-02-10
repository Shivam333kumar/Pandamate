
import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles, Trophy, Quote, Target, ShieldCheck, Zap, BrainCircuit, Loader2 } from 'lucide-react';
import { useApp } from '../state';
import { GoogleGenAI } from "@google/genai";

const ANIME_QUOTES = {
  PERFECT: [
    { text: "I’m not gonna run away, I never go back on my word! That’s my nindo: my ninja way!", author: "Naruto Uzumaki", series: "Naruto" },
    { text: "I’ll leave tomorrow’s problems to tomorrow’s me.", author: "Saitama", series: "One Punch Man" },
    { text: "I’m not going to be a hero. I’m going to be the King of Pirates!", author: "Monkey D. Luffy", series: "One Piece" },
    { text: "The moment you think of giving up, think of the reason why you held on so long.", author: "Natsu Dragneel", series: "Fairy Tail" }
  ],
  GREAT: [
    { text: "If you don’t take risks, you can’t create a future.", author: "Monkey D. Luffy", series: "One Piece" },
    { text: "Power comes in response to a need, not a desire. You have to create that need.", author: "Goku", series: "Dragon Ball Z" },
    { text: "The world isn’t perfect. But it’s there for us, doing the best it can... that’s what makes it so damn beautiful.", author: "Roy Mustang", series: "Fullmetal Alchemist" },
    { text: "Knowing what it feels like to be in pain, is exactly why we try to be kind to others.", author: "Jiraiya", series: "Naruto" }
  ],
  GOOD: [
    { text: "Hard work is worthless for those that don’t believe in themselves.", author: "Naruto Uzumaki", series: "Naruto" },
    { text: "It’s not the face that makes someone a monster, it’s the choices they make with their lives.", author: "Naruto Uzumaki", series: "Naruto" },
    { text: "Giving up is what kills people.", author: "Alucard", series: "Hellsing" },
    { text: "If you can’t find a reason to fight, then you shouldn’t be fighting.", author: "Akame", series: "Akame ga Kill!" }
  ],
  STRUGGLING: [
    { text: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger as well as kinder.", author: "Gildarts Clive", series: "Fairy Tail" },
    { text: "If you don’t like your destiny, don’t accept it. Instead have the courage to change it the way you want it to be.", author: "Naruto Uzumaki", series: "Naruto" },
    { text: "You should enjoy the little detours to the fullest. Because that's where you'll find the things more important than what you want.", author: "Ging Freecss", series: "Hunter x Hunter" },
    { text: "A person who cannot sacrifice anything, can change nothing.", author: "Armin Arlert", series: "Attack on Titan" }
  ]
};

const QuoteTab: React.FC = () => {
  const { stats, userName, tasks } = useApp();
  const [hasKey, setHasKey] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    // Check if Gemini API key is available via AI Studio platform.
    const checkKey = async () => {
      try {
        // @ts-ignore - aistudio is available in the global environment
        const result = await window.aistudio.hasSelectedApiKey();
        setHasKey(result);
      } catch (e) {
        setHasKey(false);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const performance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return stats.dailyCompletion[today] || 0;
  }, [stats.dailyCompletion]);

  const currentQuote = useMemo(() => {
    let pool = ANIME_QUOTES.STRUGGLING;
    if (performance === 100) pool = ANIME_QUOTES.PERFECT;
    else if (performance >= 80) pool = ANIME_QUOTES.GREAT;
    else if (performance >= 50) pool = ANIME_QUOTES.GOOD;
    
    const day = new Date().getDate();
    return pool[day % pool.length];
  }, [performance]);

  const themeColors = useMemo(() => {
    if (performance === 100) return "from-yellow-400 to-orange-500 text-white";
    if (performance >= 80) return "from-green-400 to-teal-500 text-white";
    if (performance >= 50) return "from-blue-400 to-indigo-500 text-white";
    return "from-gray-400 to-slate-600 text-white";
  }, [performance]);

  // Use Gemini to get personalized sensei advice.
  const getAiAdvice = async () => {
    if (!hasKey) return;
    setIsLoadingAi(true);
    try {
      // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = tasks.filter(t => t.startTime.startsWith(today));
      
      const prompt = `You are "Panda Sensei", a wise and slightly playful anime-inspired life coach.
      The user ${userName} has completed ${performance}% of their missions today.
      Their missions were: ${todaysTasks.map(t => `${t.name} (${t.completed ? 'COMPLETED' : 'INCOMPLETE'})`).join(', ')}.
      
      Provide a short, punchy piece of advice (max 2 sentences) in the style of a legendary anime master.
      If they are doing well, be encouraging. If they are struggling, give them a fiery "protagonist moment" speech.
      Do not use any special formatting or markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiAdvice(response.text || "The scroll is empty. Try again later.");
    } catch (error: any) {
      console.error("Sensei AI Error:", error);
      // If the request fails with an error message containing "Requested entity was not found.", reset key status.
      if (error?.message?.includes("Requested entity was not found")) {
        setHasKey(false);
      }
      setAiAdvice("The path is clouded. Re-check your connection in Settings.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="tab-content h-full overflow-y-auto no-scrollbar space-y-6 px-1 pb-24">
      <div className="px-2 pt-2 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Sensei's Scroll</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {hasKey ? 'Divine Wisdom • AI Connected' : 'Ancient Wisdom • Offline Mode'}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
          <Target size={16} className="text-red-500" />
          <span className="text-sm font-black text-gray-700">{performance}%</span>
        </div>
      </div>

      <div className={`relative p-8 rounded-[3rem] shadow-2xl bg-gradient-to-br ${themeColors} overflow-hidden min-h-[380px] flex flex-col justify-center transition-all duration-700`}>
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Quote size={140} />
        </div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Warrior Wisdom</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-black italic leading-tight tracking-tight drop-shadow-sm">
            "{currentQuote.text}"
          </h3>

          <div className="pt-6 border-t border-white/20">
            <p className="text-lg font-black">— {currentQuote.author}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">{currentQuote.series}</p>
          </div>
        </div>
      </div>

      {/* AI Advice Section enabled by Gemini */}
      {hasKey && (
        <div className="m3-card p-6 bg-indigo-900 text-white space-y-4 shadow-xl border-none">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-200">
              <BrainCircuit size={14} /> Sensei's Divine Voice
            </h4>
            <button 
              onClick={getAiAdvice} 
              disabled={isLoadingAi}
              className="bg-white/20 p-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {isLoadingAi ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            </button>
          </div>
          
          <div className="min-h-[60px] flex items-center justify-center">
            {aiAdvice ? (
              <p className="text-sm font-black italic text-center animate-in fade-in slide-in-from-bottom-2 leading-relaxed">
                "{aiAdvice}"
              </p>
            ) : (
              <button 
                onClick={getAiAdvice}
                className="text-xs font-black uppercase tracking-widest border border-white/30 px-6 py-2 rounded-full hover:bg-white/10 transition-colors"
              >
                Seek Guidance
              </button>
            )}
          </div>
        </div>
      )}

      <div className="m3-card p-6 bg-white space-y-4">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" /> Assessment Status
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-black text-gray-700">
            <span>Daily Mastery</span>
            <span className="text-indigo-600">{performance}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${performance}%` }}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 italic">
            <p className="text-xs font-bold text-gray-600 leading-relaxed">
              {performance === 100 ? "Ascended Master: You have achieved perfect harmony today. The panda is proud!" : 
               performance >= 80 ? "Elite Warrior: Your focus is sharp. Victory is within reach. Maintain the momentum!" :
               performance >= 50 ? "Trainee: You are putting in the work. Keep the fire burning, the path is long." :
               "Struggling Protagonist: Every legend begins with a struggle. Stand up, warrior, and move!"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Privacy Protected</span>
        </div>
        <p className="text-[11px] font-bold text-indigo-800 leading-relaxed">
          Sensei works 100% offline by default. {hasKey ? 'Gemini AI is now fueling your growth.' : 'Connect an API key in Settings to unlock dynamic training sessions.'}
        </p>
      </div>
    </div>
  );
};

export default QuoteTab;
