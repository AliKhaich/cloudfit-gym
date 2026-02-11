
import React, { useState, useEffect, useRef } from 'react';
import { Workout, Exercise, LOCAL_DISPLAY_ID } from '../types';
import { MOCK_EXERCISES } from '../constants';

interface PlayerProps {
  workout: Workout;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ workout, onClose }) => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  
  const currentModule = workout?.modules?.[currentModuleIndex];
  const isLocal = currentModule?.displayId === LOCAL_DISPLAY_ID;

  const timerRef = useRef<number | null>(null);
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Map<string, any>>(new Map());

  // Initialize PeerJS on the phone
  useEffect(() => {
    if (!workout?.modules) return;

    // @ts-ignore
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const remoteDisplayIds = Array.from(new Set(
        workout.modules
          .filter(m => m && m.displayId !== LOCAL_DISPLAY_ID)
          .map(m => m.displayId)
      ));

      remoteDisplayIds.forEach(id => {
        const conn = peer.connect(id);
        conn.on('open', () => {
          connectionsRef.current.set(id, conn);
        });
      });
    });

    return () => {
      connectionsRef.current.forEach(conn => {
        conn.send({ type: 'END_SESSION' });
        conn.close();
      });
      peer.destroy();
    };
  }, [workout]);

  useEffect(() => {
    if (currentModule) {
      const baseEx = MOCK_EXERCISES.find(ex => ex.id === currentModule.exerciseId);
      if (baseEx) {
        const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
        setExercise(overrides[baseEx.id] || baseEx);
      }
      
      const moduleDuration = currentModule.duration ?? MOCK_EXERCISES.find(ex => ex.id === currentModule.exerciseId)?.duration ?? 0;
      setTimeLeft(moduleDuration);
    } else {
      setExercise(null);
    }
  }, [currentModuleIndex, currentModule]);

  // Sync state to the specific display for this module
  useEffect(() => {
    if (exercise && !isLocal && currentModule?.displayId) {
      const conn = connectionsRef.current.get(currentModule.displayId);
      if (conn && conn.open) {
        conn.send({
          type: 'SYNC_STATE',
          payload: { exercise, timeLeft, isPaused }
        });
      }
    }
  }, [exercise, timeLeft, isPaused, isLocal, currentModule?.displayId]);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentModule && currentModuleIndex < workout.modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
    } else if (timeLeft === 0 && currentModule && currentModuleIndex === workout.modules.length - 1) {
      setExercise(null); 
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isPaused, currentModuleIndex, workout?.modules?.length, !!currentModule]);

  // Final Complete Screen
  if (!currentModule || !exercise) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] z-[300] flex flex-col items-center justify-center p-8 text-white text-center overflow-hidden touch-none">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8 text-green-500 animate-bounce">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-4xl font-black uppercase italic mb-4 tracking-tighter">Workout Complete!</h2>
        <p className="text-gray-400 mb-12 font-medium">Excellent effort. Session data saved locally.</p>
        <button 
          onClick={onClose} 
          className="w-full max-w-xs py-5 bg-[#E1523D] rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-900/20 active:scale-95 transition-all"
        >
          Finish Session
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1A1A1A] z-[200] flex flex-col text-white animate-in fade-in duration-300 overflow-hidden touch-none overscroll-none">
      {/* Header - Fixed Height */}
      <div className="h-20 shrink-0 px-6 flex justify-between items-center border-b border-white/5">
        <div>
          <h3 className="text-[10px] font-black text-[#E1523D] uppercase tracking-[0.2em]">In Progress</h3>
          <p className="font-bold text-base truncate max-w-[200px]">{workout.name}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Main Content - Flexible Height */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center space-y-6">
        {isLocal ? (
          <div className="w-full flex flex-col items-center justify-center flex-1 min-h-0">
            <div className="relative w-full max-w-md aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/5 max-h-[35vh]">
              {exercise.videoUrl ? (
                <video src={exercise.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={exercise.thumbnail} className="w-full h-full object-cover opacity-50 blur-sm" alt={exercise.name} />
              )}
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-tight">{exercise.name}</h2>
              <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">{exercise.category}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-in slide-in-from-bottom duration-500">
            <div className="w-28 h-20 border-4 border-[#E1523D] rounded-2xl flex items-center justify-center bg-white/5 shadow-[0_0_40px_rgba(225,82,61,0.2)]">
                <svg className="w-10 h-10 text-[#E1523D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold uppercase tracking-wider">Casting: {exercise.name}</h2>
              <p className="text-[#E1523D] font-mono font-bold tracking-widest">DISPLAY: {currentModule?.displayId}</p>
            </div>
          </div>
        )}

        {/* Timer - Scaleable */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="text-[10rem] sm:text-[12rem] font-black italic tabular-nums text-[#E1523D] leading-none tracking-tighter">
            {timeLeft}
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.4em] -mt-2 text-xs">Seconds</p>
        </div>
      </div>

      {/* Controls - Fixed Height at Bottom */}
      <div className="h-32 shrink-0 flex justify-center items-center gap-10 bg-black/40 backdrop-blur-md border-t border-white/5 px-6">
        <button 
          disabled={currentModuleIndex === 0} 
          onClick={() => setCurrentModuleIndex(prev => prev - 1)} 
          className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" /></svg>
        </button>
        
        <button 
          onClick={() => setIsPaused(!isPaused)} 
          className="w-20 h-20 bg-[#E1523D] rounded-full flex items-center justify-center shadow-2xl shadow-orange-900/40 active:scale-95 transition-all"
        >
          {isPaused ? (
            <svg className="w-10 h-10 ml-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 14L14.41 8.41a.89.89 0 000-1.58L4.02 1.25a.89.89 0 00-1.33.79V13.2a.89.89 0 001.33.8z" /></svg>
          ) : (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" /></svg>
          )}
        </button>

        <button 
          disabled={currentModuleIndex === workout.modules.length - 1} 
          onClick={() => setCurrentModuleIndex(prev => prev + 1)} 
          className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" /></svg>
        </button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="h-1.5 bg-white/5 w-full shrink-0">
        <div 
          className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(225,82,61,0.5)]" 
          style={{ width: `${((currentModuleIndex + 1) / workout.modules.length) * 100}%` }} 
        />
      </div>
    </div>
  );
};
