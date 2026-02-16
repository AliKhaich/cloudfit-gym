import React, { useState, useEffect } from 'react';
import { Workout, WorkoutModule, Exercise, Display, LOCAL_DISPLAY_ID } from '../types';
import { storage } from '../services/storage';
import { MOCK_EXERCISES } from '../constants';

interface PrepareProps {
  workout: Workout;
  onStart: (workout: Workout) => void;
  onEdit: (workout: Workout) => void;
  onClose: () => void;
}

export const Prepare: React.FC<PrepareProps> = ({ workout, onStart, onEdit, onClose }) => {
  const [editedWorkout, setEditedWorkout] = useState<Workout>({ ...workout });
  const [displays, setDisplays] = useState<Display[]>([]);
  const [allAvailableExercises, setAllAvailableExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    setDisplays(storage.getDisplays());
    setAllAvailableExercises([...MOCK_EXERCISES, ...storage.getCustomExercises()]);
  }, []);

  const updateModuleDuration = (moduleId: string, totalSeconds: number) => {
    setEditedWorkout({
      ...editedWorkout,
      modules: editedWorkout.modules.map(m => m.id === moduleId ? { ...m, duration: Math.max(0, totalSeconds) } : m),
      lastModified: Date.now()
    });
  };

  const updateModuleDisplay = (moduleId: string, displayId: string) => {
    setEditedWorkout({
      ...editedWorkout,
      modules: editedWorkout.modules.map(m => m.id === moduleId ? { ...m, displayId } : m),
      lastModified: Date.now()
    });
  };

  const calculateTotalTime = () => {
    const totalSeconds = editedWorkout.modules.reduce((acc, m) => {
      const exercise = allAvailableExercises.find(ex => ex.id === m.exerciseId);
      return acc + (m.duration ?? exercise?.duration ?? 0);
    }, 0);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const hasModules = editedWorkout.modules.length > 0;

  return (
    <div className="fixed inset-0 min-h-screen bg-[#1A1A1A] text-white animate-in slide-in-from-bottom duration-500 flex flex-col z-[100]">
      <div className="h-20 shrink-0 px-6 flex items-center justify-between border-b border-white/5 bg-black/20">
        <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black uppercase italic tracking-tighter truncate max-w-[180px] leading-tight">{workout.name}</h2>
          <p className="text-[10px] font-black text-[#E1523D] uppercase tracking-[0.2em]">{calculateTotalTime()}</p>
        </div>
        <button onClick={() => onEdit(editedWorkout)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 mb-6">
           <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Ready to Sweat?</h3>
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-6 h-6 rounded-full border-2 border-[#E1523D] flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-[#E1523D] rounded-full"></div>
                 </div>
                 <span className="text-sm font-bold text-gray-300">Displays synced and waiting</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-6 h-6 rounded-full border-2 border-[#E1523D] flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-[#E1523D] rounded-full"></div>
                 </div>
                 <span className="text-sm font-bold text-gray-300">Equipment in place</span>
              </div>
           </div>
        </div>

        {hasModules ? editedWorkout.modules.map((m, idx) => {
          const exercise = allAvailableExercises.find(ex => ex.id === m.exerciseId);
          const currentDuration = m.duration ?? exercise?.duration ?? 0;
          const mPart = Math.floor(currentDuration / 60);
          const sPart = currentDuration % 60;

          return (
            <div key={m.id} className="bg-white/5 p-5 rounded-[32px] border border-white/5 flex flex-col gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center font-black text-[#E1523D] italic">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm leading-tight">{exercise?.name || 'Unknown Exercise'}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{exercise?.category || 'Custom'}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl border border-white/5">
                      <button onClick={() => updateModuleDuration(m.id, currentDuration - 60)} className="text-gray-400 hover:text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                      </button>
                      <div className="text-center min-w-[24px]">
                        <span className="text-sm font-black italic">{mPart}</span>
                        <p className="text-[6px] font-black uppercase text-gray-500">MIN</p>
                      </div>
                      <button onClick={() => updateModuleDuration(m.id, currentDuration + 60)} className="text-gray-400 hover:text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl border border-white/5">
                      <button onClick={() => updateModuleDuration(m.id, currentDuration - 5)} className="text-gray-400 hover:text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                      </button>
                      <div className="text-center min-w-[24px]">
                        <span className="text-sm font-black italic">{sPart}</span>
                        <p className="text-[6px] font-black uppercase text-gray-500">SEC</p>
                      </div>
                      <button onClick={() => updateModuleDuration(m.id, currentDuration + 5)} className="text-gray-400 hover:text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>
               </div>

               <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2 relative">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <select 
                      value={m.displayId}
                      onChange={(e) => updateModuleDisplay(m.id, e.target.value)}
                      className="text-[10px] font-black uppercase tracking-widest bg-transparent outline-none pr-4 cursor-pointer"
                    >
                      <option value={LOCAL_DISPLAY_ID} className="bg-[#1A1A1A]">Local Device</option>
                      {displays.map(d => (
                        <option key={d.id} value={d.id} className="bg-[#1A1A1A]">{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#E1523D] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#E1523D] rounded-full animate-pulse"></div>
                    Synced
                  </div>
               </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center flex flex-col items-center gap-4 bg-white/5 rounded-[40px] border-2 border-dashed border-white/5">
            <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">This workout is empty</p>
            <button onClick={() => onEdit(editedWorkout)} className="text-[#E1523D] text-[10px] font-black uppercase tracking-widest border-b border-[#E1523D]">Add Exercises Now</button>
          </div>
        )}
        <div className="h-24" />
      </div>

      <div className="p-8 pb-10 bg-gradient-to-t from-black to-transparent shrink-0">
        <button 
          onClick={() => onStart(editedWorkout)}
          disabled={!hasModules}
          className="w-full py-5 bg-[#E1523D] text-white rounded-[28px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-orange-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M4.018 14L14.41 8.41a.89.89 0 000-1.58L4.02 1.25a.89.89 0 00-1.33.79V13.2a.89.89 0 001.33.8z" /></svg>
          Go Live
        </button>
      </div>
    </div>
  );
};
