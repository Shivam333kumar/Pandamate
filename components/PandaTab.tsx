
import React from 'react';
import PandaMascot from './PandaMascot';
import { useApp } from '../state';
import { Play, Home, Zap } from 'lucide-react';

const PandaTab: React.FC = () => {
  const { setPandaState } = useApp();

  return (
    <div className="h-full flex flex-col items-center">
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-2xl font-black text-gray-800">Your Mate</h2>
        <p className="text-sm text-gray-500">Double tap to play or send home!</p>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        <PandaMascot size="large" staticPosition={true} />
      </div>

      {/* Action Controls */}
      <div className="grid grid-cols-3 gap-4 w-full px-4 mb-8">
        <button 
          onClick={() => setPandaState('PLAYING')}
          className="flex flex-col items-center gap-2 p-4 bg-white/60 rounded-3xl shadow-sm border border-white hover:bg-green-50 transition-colors"
        >
          <div className="p-3 bg-green-100 text-green-600 rounded-2xl"><Play size={24} /></div>
          <span className="text-xs font-bold text-gray-700">Play Mode</span>
        </button>
        <button 
          onClick={() => setPandaState('HIDING')}
          className="flex flex-col items-center gap-2 p-4 bg-white/60 rounded-3xl shadow-sm border border-white hover:bg-purple-50 transition-colors"
        >
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><Home size={24} /></div>
          <span className="text-xs font-bold text-gray-700">Hide</span>
        </button>
        <button 
          onClick={() => setPandaState('SHOCKED')}
          className="flex flex-col items-center gap-2 p-4 bg-white/60 rounded-3xl shadow-sm border border-white hover:bg-orange-50 transition-colors"
        >
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Zap size={24} /></div>
          <span className="text-xs font-bold text-gray-700">Shock</span>
        </button>
      </div>
    </div>
  );
};

export default PandaTab;
