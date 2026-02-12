
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const currentModule = workout?.modules?.[currentModuleIndex];
  const isLocal = currentModule?.displayId === LOCAL_DISPLAY_ID;

  const timerRef = useRef<number | null>(null);
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Map<string, any>>(new Map());

  // Initialize PeerJS and establish all connections
  useEffect(() => {
    if (!workout?.modules) return;

    // @ts-ignore
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      // Connect to all unique displays involved in this workout
      const remoteDisplayIds = Array.from(new Set(
        workout.modules
          .filter(m => m && m.displayId !== LOCAL_DISPLAY_ID)
          .map(m => m.displayId)
      ));

      remoteDisplayIds.forEach(id => {
        const conn = peer.connect(id);
        conn.on('open', () => {
          connectionsRef.current.set(id, conn);
          // Initial sync immediately upon connection
          conn.send({
            type: 'GLOBAL_SYNC',
            payload: { 
              workout,
              currentModuleIndex,
              timeLeft, 
              isPaused 
            }
          });
        });
      });
    });

    return () => {
      connectionsRef.current.forEach(conn => {
        if (conn && conn.open) conn.send({ type: 'END_SESSION' });
        conn.close();
      });
      peer.destroy();
    };
  }, [workout]);

  // Handle Exercise Loading and Transitions on the Phone
  useEffect(() => {
    if (currentModule) {
      const baseEx = MOCK_EXERCISES.find(ex => ex.id === currentModule.exerciseId);
      if (baseEx) {
        const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
        setExercise(overrides[baseEx.id] || baseEx);
      }
      
      const moduleDuration = currentModule.duration ?? MOCK_EXERCISES.find(ex => ex.id === currentModule.exerciseId)?.duration ?? 0;
      setTimeLeft(moduleDuration);
      setIsInitialLoading(false);
    } else {
      setExercise(null);
      setIsInitialLoading(false);
    }
  }, [currentModuleIndex, currentModule]);

  // BROADCAST Sync to ALL connected TVs
  // We sync every time the timer ticks, the pause state changes, or we move to a new module.
  useEffect(() => {
    connectionsRef.current.forEach((conn, displayId) => {
      if (conn && conn.open) {
        conn.send({
          type: 'GLOBAL_SYNC',
          payload: {
            workout,
            currentModuleIndex,
            timeLeft,
            isPaused
          }
        });
      }
    });
  }, [timeLeft, isPaused, currentModuleIndex, workout]);

  // Main Timer Logic
  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isInitialLoading) {
      if (workout?.modules && currentModuleIndex < workout.modules.length - 1) {
        setCurrentModuleIndex(prev => prev + 1);
      } else {
        setExercise(null); // End workout
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isPaused, currentModuleIndex, workout?.modules?.length, isInitialLoading]);

  // Loading Placeholder
  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] z-[300] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#E1523D] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Preparing...</p>
      </div>
    );
  }

  // Final Complete Screen
  if (!currentModule || !exercise) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] z-[300] flex flex-col items-center justify-center p-8 text-white text-center overflow-hidden touch-none">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 animate-bounce">
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">Session Done!</h2>
        <p className="text-gray-400 mb-10 font-medium text-sm">Workout recorded to your local log.</p>
        <button 
          onClick={onClose} 
          className="w-full max-w-xs py-4 bg-[#E1523D] rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          Finish
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1A1A1A] z-[200] flex flex-col text-white animate-in fade-in duration-300 overflow-hidden touch-none overscroll-none select-none">
      {/* Header */}
      <div className="h-16 shrink-0 px-6 flex justify-between items-center border-b border-white/5 bg-black/20">
        <div className="min-w-0 flex-1">
          <h3 className="text-[9px] font-black text-[#E1523D] uppercase tracking-[0.2em] leading-none mb-1">Active Set</h3>
          <p className="font-bold text-sm truncate">{workout.name}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-4 text-center">
        {isLocal ? (
          <div className="w-full flex flex-col items-center justify-center flex-1 min-h-0">
            <div className="relative w-full max-w-sm aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/5 max-h-[30vh]">
              {exercise.videoUrl ? (
                <video src={exercise.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={exercise.thumbnail} className="w-full h-full object-cover opacity-50 blur-sm" alt={exercise.name} />
              )}
            </div>
            <div className="mt-4 shrink-0">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-tight">{exercise.name}</h2>
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{exercise.category}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-24 h-16 border-4 border-[#E1523D] rounded-xl flex items-center justify-center bg-[#E1523D]/5 shadow-[0_0_30px_rgba(225,82,61,0.2)]">
                <svg className="w-8 h-8 text-[#E1523D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold uppercase tracking-wider">Casting: {exercise.name}</h2>
              <p className="text-[#E1523D] font-mono font-bold text-xs tracking-widest">DISPLAY: {currentModule?.displayId}</p>
            </div>
          </div>
        )}

        {/* Big Scaled Timer */}
        <div className="shrink-0 flex flex-col items-center justify-center py-2">
          <div className="text-[12rem] sm:text-[14rem] font-black italic tabular-nums text-[#E1523D] leading-none tracking-tighter select-none">
            {timeLeft}
          </div>
          <p className="text-gray-500 font-black uppercase tracking-[0.4em] -mt-4 text-[10px]">Seconds Remaining</p>
        </div>
      </div>

      {/* Controls */}
      <div className="h-28 shrink-0 flex justify-center items-center gap-8 bg-black/40 backdrop-blur-xl border-t border-white/5 px-6 pb-safe">
        <button 
          disabled={currentModuleIndex === 0} 
          onClick={() => setCurrentModuleIndex(prev => prev - 1)} 
          className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center disabled:opacity-10 active:scale-90 transition-all"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" /></svg>
        </button>
        
        <button 
          onClick={() => setIsPaused(!isPaused)} 
          className="w-20 h-20 bg-[#E1523D] rounded-full flex items-center justify-center shadow-2xl shadow-orange-900/40 active:scale-95 transition-all"
        >
          {isPaused ? (
            <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 14L14.41 8.41a.89.89 0 000-1.58L4.02 1.25a.89.89 0 00-1.33.79V13.2a.89.89 0 001.33.8z" /></svg>
          ) : (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" /></svg>
          )}
        </button>

        <button 
          disabled={!workout?.modules || currentModuleIndex === workout.modules.length - 1} 
          onClick={() => setCurrentModuleIndex(prev => prev + 1)} 
          className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center disabled:opacity-10 active:scale-90 transition-all"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" /></svg>
        </button>
      </div>

      {/* Footer Progress */}
      <div className="h-1 bg-white/5 w-full shrink-0">
        <div 
          className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(225,82,61,0.5)]" 
          style={{ width: `${((currentModuleIndex + 1) / (workout?.modules?.length || 1)) * 100}%` }} 
        />
      </div>
    </div>
  );
};
