
import React, { useState, useEffect, useRef } from 'react';
import { Workout, Exercise, LOCAL_DISPLAY_ID } from '../types';
import { STATIC_EXERCISES } from '../constants';
import { storage } from '../services/storage';

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

  // Initialize PeerJS - Host Mode
  useEffect(() => {
    if (!workout?.modules) return;
    
    // @ts-ignore
    const peer = new Peer();
    peerRef.current = peer;
    
    peer.on('open', () => {
      // Find all unique remote display IDs used in this workout
      const remoteDisplayIds = Array.from(new Set(
        workout.modules
          .filter(m => m && m.displayId && m.displayId !== LOCAL_DISPLAY_ID)
          .map(m => m.displayId.toUpperCase().trim())
      ));
      
      remoteDisplayIds.forEach(id => {
        if (!id) return;
        const conn = peer.connect(id, { reliable: true });
        
        conn.on('open', () => {
          connectionsRef.current.set(id, conn);
          // Initial sync immediately
          sendSync(conn);
        });

        conn.on('close', () => {
          connectionsRef.current.delete(id);
        });

        conn.on('error', () => {
          connectionsRef.current.delete(id);
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
  }, [workout.id]);

  const sendSync = (conn: any) => {
    if (!conn || !conn.open) return;
    // CRITICAL FIX: Always send the workout object. 
    // This ensures TVs that join late or drop a packet stay synced.
    conn.send({
      type: 'HEARTBEAT',
      payload: {
        workout: workout, 
        currentModuleIndex,
        timeLeft,
        isPaused
      }
    });
  };

  // Broadcast updates to ALL connected TVs every time timer or state changes
  useEffect(() => {
    connectionsRef.current.forEach(conn => sendSync(conn));
  }, [timeLeft, isPaused, currentModuleIndex]);

  // Load Host-side exercise
  useEffect(() => {
    if (currentModule) {
      const allEx = [...STATIC_EXERCISES, ...storage.getCustomExercises()];
      const ex = allEx.find(e => e.id === currentModule.exerciseId);
      if (ex) {
        setExercise(ex);
        setTimeLeft(currentModule.duration ?? ex.duration ?? 0);
      }
      setIsInitialLoading(false);
    }
  }, [currentModuleIndex, currentModule]);

  // Global Timer logic
  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isInitialLoading) {
      if (workout?.modules && currentModuleIndex < workout.modules.length - 1) {
        setCurrentModuleIndex(prev => prev + 1);
      } else {
        // Workout finished
        setExercise(null);
        connectionsRef.current.forEach(conn => {
          if (conn.open) conn.send({ type: 'END_SESSION' });
        });
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, isPaused, currentModuleIndex, workout?.modules?.length, isInitialLoading]);

  const formatTimeDisplay = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m === 0) return s;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isInitialLoading) return (
    <div className="fixed inset-0 bg-[#1A1A1A] flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-[#E1523D] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Launching Session...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#1A1A1A] flex flex-col text-white overflow-hidden select-none z-[100]">
      <div className="h-20 shrink-0 px-6 flex items-center border-b border-white/5 bg-black/40 backdrop-blur-md">
        <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex-1 text-center px-4">
          <h3 className="text-[10px] font-black text-[#E1523D] uppercase tracking-[0.3em] leading-none mb-1">Host Console</h3>
          <p className="font-bold text-sm truncate uppercase tracking-tighter italic">{workout.name}</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex -space-x-1.5">
             {/* Fix: Explicitly type 'id' as string to avoid 'unknown' error on substring() */}
             {Array.from(connectionsRef.current.keys()).map((id: string) => (
               <div key={id} className="w-6 h-6 rounded-full bg-[#E1523D] border-2 border-[#1A1A1A] flex items-center justify-center text-[8px] font-black shadow-sm" title={`TV: ${id}`}>
                 {id.substring(0, 1)}
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 text-center">
        {isLocal && exercise ? (
          <div className="w-full flex flex-col items-center justify-center flex-1">
            <div className="relative w-full max-w-sm aspect-video rounded-[32px] overflow-hidden shadow-2xl bg-black border border-white/10 max-h-[35vh]">
              <video src={exercise.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            </div>
            <div className="mt-6">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-tight">{exercise.name}</h2>
              <span className="text-[#E1523D] font-black uppercase tracking-[0.2em] text-[11px] mt-1 block">Local Station</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-18 border-4 border-[#E1523D] rounded-[24px] flex items-center justify-center bg-[#E1523D]/10 animate-pulse">
                <svg className="w-10 h-10 text-[#E1523D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black uppercase italic tracking-widest text-white/90">
                {isLocal ? "Rest Period" : "Remote Display Active"}
              </h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Currently casting to {connectionsRef.current.size} displays</p>
            </div>
          </div>
        )}

        <div className="shrink-0 flex flex-col items-center justify-center py-4">
          <div className={`${timeLeft >= 60 ? 'text-[8rem] md:text-[10rem]' : 'text-[12rem] md:text-[15rem]'} font-black italic tabular-nums text-white leading-none tracking-tighter drop-shadow-2xl`}>
            {formatTimeDisplay(timeLeft)}
          </div>
        </div>
      </div>

      <div className="h-32 flex justify-center items-center gap-10 bg-black/60 backdrop-blur-2xl border-t border-white/5 pb-safe">
        <button disabled={currentModuleIndex === 0} onClick={() => setCurrentModuleIndex(prev => prev - 1)} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center disabled:opacity-5 transition-all active:scale-90">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" /></svg>
        </button>
        <button onClick={() => setIsPaused(!isPaused)} className="w-24 h-24 bg-[#E1523D] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,82,61,0.4)] active:scale-95 transition-all">
          {isPaused ? (
            <svg className="w-12 h-12 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 14L14.41 8.41a.89.89 0 000-1.58L4.02 1.25a.89.89 0 00-1.33.79V13.2a.89.89 0 001.33.8z" /></svg>
          ) : (
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" /></svg>
          )}
        </button>
        <button disabled={currentModuleIndex === workout.modules.length - 1} onClick={() => setCurrentModuleIndex(prev => prev + 1)} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center disabled:opacity-5 transition-all active:scale-90">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" /></svg>
        </button>
      </div>
    </div>
  );
};
