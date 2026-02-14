
import React, { useState, useEffect } from 'react';
import { Workout, WorkoutModule, Exercise, Display, LOCAL_DISPLAY_ID, Folder } from '../types';
import { storage } from '../services/storage';
import { Library } from './Library';
import { MOCK_EXERCISES } from '../constants';

interface EditorProps {
  workout: Workout;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  onPlay: (workout: Workout) => void;
}

export const WorkoutEditor: React.FC<EditorProps> = ({ workout, onSave, onCancel, onPlay }) => {
  const [editedWorkout, setEditedWorkout] = useState<Workout>({ ...workout });
  const [showLibrary, setShowLibrary] = useState(false);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => {
    setDisplays(storage.getDisplays());
    setFolders(storage.getFolders());
  }, []);

  const addModule = (exercise: Exercise) => {
    const newModule: WorkoutModule = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseId: exercise.id,
      displayId: LOCAL_DISPLAY_ID,
      duration: exercise.duration
    };
    
    setEditedWorkout(prev => ({
      ...prev,
      modules: [...prev.modules, newModule],
      lastModified: Date.now()
    }));

    setLastAddedId(newModule.id);
    setTimeout(() => setLastAddedId(null), 1000);
  };

  const toggleScheduleDay = (day: number) => {
    const current = editedWorkout.scheduledDays || [];
    const updated = current.includes(day) 
      ? current.filter(d => d !== day) 
      : [...current, day];
    
    setEditedWorkout({ ...editedWorkout, scheduledDays: updated });
  };

  const toggleFolderMembership = (folderId: string) => {
    const updatedFolders = folders.map(f => {
      if (f.id === folderId) {
        const hasWorkout = f.workoutIds.includes(editedWorkout.id);
        return {
          ...f,
          workoutIds: hasWorkout 
            ? f.workoutIds.filter(id => id !== editedWorkout.id)
            : [...f.workoutIds, editedWorkout.id]
        };
      }
      return f;
    });
    setFolders(updatedFolders);
    storage.setFolders(updatedFolders);
  };

  const updateModuleDisplay = (moduleId: string, displayId: string) => {
    setEditedWorkout({
      ...editedWorkout,
      modules: editedWorkout.modules.map(m => m.id === moduleId ? { ...m, displayId } : m),
      lastModified: Date.now()
    });
  };

  const updateModuleDuration = (moduleId: string, duration: number) => {
    setEditedWorkout({
      ...editedWorkout,
      modules: editedWorkout.modules.map(m => m.id === moduleId ? { ...m, duration: Math.max(5, duration) } : m),
      lastModified: Date.now()
    });
  };

  const removeModule = (moduleId: string) => {
    setEditedWorkout({
      ...editedWorkout,
      modules: editedWorkout.modules.filter(m => m.id !== moduleId),
      lastModified: Date.now()
    });
  };

  const calculateTotalTime = () => {
    const totalSeconds = editedWorkout.modules.reduce((acc, m) => {
      const exercise = MOCK_EXERCISES.find(ex => ex.id === m.exerciseId);
      return acc + (m.duration ?? exercise?.duration ?? 0);
    }, 0);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  if (showLibrary) {
    return (
      <div className="bg-[#F5F5F5] min-h-screen flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 flex items-center justify-between bg-white border-b sticky top-0 z-50">
           <div className="flex items-center gap-4">
             <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <h2 className="text-lg font-bold">Add Exercises</h2>
           </div>
           <button 
             onClick={() => setShowLibrary(false)}
             className="bg-[#1A1A1A] text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
           >
             Done ({editedWorkout.modules.length})
           </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Library onSelectExercise={addModule} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-colors">Cancel</button>
        <h2 className="text-xl font-bold uppercase italic tracking-tighter">Edit Workout</h2>
        <div className="flex items-center gap-3">
          {editedWorkout.modules.length > 0 && (
             <button 
               onClick={() => onPlay(editedWorkout)}
               className="bg-[#1A1A1A] text-white p-2.5 rounded-full hover:scale-110 transition-all active:scale-95"
             >
               <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M4.018 14L14.41 8.41a.89.89 0 000-1.58L4.02 1.25a.89.89 0 00-1.33.79V13.2a.89.89 0 001.33.8z" /></svg>
             </button>
          )}
          <button 
            onClick={() => onSave(editedWorkout)} 
            className="bg-[#E1523D] text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-100 hover:scale-105 transition-all active:scale-95"
          >
            Save
          </button>
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <label className="text-[10px] font-extrabold text-[#E1523D] uppercase tracking-widest mb-2 block">Workout Name</label>
        <input 
          type="text" 
          placeholder="Give it a name..."
          value={editedWorkout.name}
          onChange={(e) => setEditedWorkout({ ...editedWorkout, name: e.target.value })}
          className="w-full text-2xl font-bold bg-transparent outline-none py-1 placeholder:text-gray-200"
        />
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50">
           <div className="px-3 py-1 bg-[#E1523D]/10 rounded-lg">
              <span className="text-[10px] font-black text-[#E1523D] uppercase tracking-widest">Total Time: {calculateTotalTime()}</span>
           </div>
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-4">Management</h3>
        
        <div className="mb-6">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Schedule Days</label>
          <div className="flex justify-between">
            {days.map((day, i) => {
              const isActive = editedWorkout.scheduledDays?.includes(i);
              return (
                <button 
                  key={i}
                  onClick={() => toggleScheduleDay(i)}
                  className={`w-9 h-9 rounded-full font-bold text-xs transition-all ${isActive ? 'bg-[#E1523D] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Folders</label>
          <div className="flex flex-wrap gap-2">
            {folders.map(f => {
              const isMember = f.workoutIds.includes(editedWorkout.id);
              return (
                <button 
                  key={f.id}
                  onClick={() => toggleFolderMembership(f.id)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${isMember ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-gray-400 border-gray-100'}`}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-extrabold text-[#1A1A1A]/80 tracking-widest uppercase">Workout Modules ({editedWorkout.modules.length})</h3>
        <button 
          onClick={() => setShowLibrary(true)}
          className="text-[11px] font-extrabold text-[#E1523D] tracking-widest uppercase flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Add Module
        </button>
      </div>

      <div className="space-y-4">
        {editedWorkout.modules.map((m, idx) => {
          const exercise = MOCK_EXERCISES.find(ex => ex.id === m.exerciseId);
          const isJustAdded = m.id === lastAddedId;
          const currentDuration = m.duration ?? exercise?.duration ?? 0;
          
          return (
            <div 
              key={m.id} 
              className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 transition-all duration-500 ${isJustAdded ? 'ring-2 ring-[#E1523D] scale-[1.02]' : ''}`}
            >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-[#1A1A1A]/20 italic text-xl">
                   {String(idx + 1).padStart(2, '0')}
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-gray-900 leading-tight">{exercise?.name}</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{exercise?.category}</p>
                 </div>
                 <button 
                   onClick={() => removeModule(m.id)} 
                   className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                 >
                   {/* Minimalist "-" icon for removal */}
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                   </svg>
                 </button>
              </div>
              
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 group relative">
                  <div className="p-1.5 bg-orange-50 rounded-lg">
                    <svg className="w-3.5 h-3.5 text-[#E1523D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <select 
                    value={m.displayId}
                    onChange={(e) => updateModuleDisplay(m.id, e.target.value)}
                    className="text-[11px] font-bold uppercase tracking-widest text-[#E1523D] bg-transparent outline-none cursor-pointer appearance-none pr-6"
                  >
                    <option value={LOCAL_DISPLAY_ID}>This Device</option>
                    {displays.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <svg className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#E1523D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100">
                  <button 
                    onClick={() => updateModuleDuration(m.id, currentDuration - 5)}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#E1523D] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                  </button>
                  <div className="flex flex-col items-center min-w-[40px]">
                    <input 
                      type="number"
                      value={currentDuration}
                      onChange={(e) => updateModuleDuration(m.id, parseInt(e.target.value) || 0)}
                      className="w-full text-center bg-transparent text-[11px] font-black text-gray-800 outline-none"
                    />
                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">SEC</span>
                  </div>
                  <button 
                    onClick={() => updateModuleDuration(m.id, currentDuration + 5)}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#E1523D] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="h-20" />
    </div>
  );
};
