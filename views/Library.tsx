
import React, { useState, useEffect } from 'react';
import { MOCK_EXERCISES } from '../constants';
import { Exercise } from '../types';

interface LibraryProps {
  onSelectExercise?: (exercise: Exercise) => void;
  onGenerateVideo?: (exercise: Exercise) => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelectExercise, onGenerateVideo }) => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Exercise>>({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
    setOverrides(stored);
  }, []);

  const categories = ['All', 'Cardio', 'Strength', 'Core', 'Legs', 'HIIT'];

  const exercises = MOCK_EXERCISES.map(ex => overrides[ex.id] || ex);

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCat === 'All' || ex.category === activeCat;
    return matchesSearch && matchesCat;
  });

  const handleSelect = (ex: Exercise) => {
    setAnimatingId(ex.id);
    onSelectExercise?.(ex);
    setTimeout(() => setAnimatingId(null), 600);
  };

  return (
    <div className="p-4 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Search exercises..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E1523D]/10 focus:border-[#E1523D] shadow-sm font-medium transition-all"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 -mx-4 px-4">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest border-2 whitespace-nowrap transition-all active:scale-90
              ${activeCat === cat 
                ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-lg' 
                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length > 0 ? filtered.map(ex => (
          <div 
            key={ex.id} 
            className={`bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 flex flex-col group transition-all duration-300 relative
              ${animatingId === ex.id ? 'ring-2 ring-[#E1523D] scale-[0.98]' : ''}`}
          >
            <div className="flex items-center p-1" onClick={() => handleSelect(ex)}>
              <div className="relative cursor-pointer">
                <img src={ex.thumbnail} alt={ex.name} className="w-28 h-28 object-cover rounded-[28px]" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="p-5 flex-1 min-w-0 cursor-pointer">
                <span className="text-[10px] font-extrabold text-[#E1523D] uppercase tracking-widest mb-1 block">{ex.category}</span>
                <h4 className="text-lg font-extrabold text-gray-900 group-hover:text-[#E1523D] transition-colors truncate">{ex.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{ex.duration}s</span>
                  </div>
                  {ex.videoUrl && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="text-[9px] font-black text-green-600 uppercase">AI Video Ready</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pr-6 cursor-pointer">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${animatingId === ex.id 
                    ? 'bg-[#E1523D] text-white scale-110' 
                    : 'bg-gray-50 text-gray-400 group-hover:bg-[#E1523D] group-hover:text-white'}`}
                >
                  {animatingId === ex.id ? (
                    <svg className="w-6 h-6 animate-in zoom-in" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-0 border-t border-gray-50 flex justify-end">
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onGenerateVideo?.(ex);
                 }}
                 className="flex items-center gap-2 py-2 px-4 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors group/btn"
               >
                 <svg className={`w-4 h-4 ${ex.videoUrl ? 'text-green-500' : 'text-gray-400 group-hover/btn:text-[#E1523D]'}`} fill="currentColor" viewBox="0 0 20 20">
                   <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                 </svg>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${ex.videoUrl ? 'text-green-600' : 'text-gray-400 group-hover/btn:text-[#E1523D]'}`}>
                   {ex.videoUrl ? 'Regenerate Video' : 'Generate AI Video'}
                 </span>
               </button>
            </div>

            {animatingId === ex.id && (
              <div className="absolute top-2 right-2 bg-[#E1523D] text-white text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full animate-bounce">
                Added
              </div>
            )}
          </div>
        )) : (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No exercises found</p>
          </div>
        )}
      </div>
      
      {/* Safe area padding */}
      <div className="h-20" />
    </div>
  );
};
