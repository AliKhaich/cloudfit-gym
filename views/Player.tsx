
import React, { useState, useEffect, useRef } from 'react';
import { Workout, Exercise, LOCAL_DISPLAY_ID } from '../types';
import { MOCK_EXERCISES } from '../constants';
import { assetStorage } from '../services/assetStorage';
import { storage } from '../services/storage';

interface PlayerProps {
  workout: Workout;
  onClose: () => void;
}

interface MediaMapEntry {
  exercise: Exercise;
  videoBlob: Blob | null;
  thumbnailBlob: Blob | null;
}

export const Player: React.FC<PlayerProps> = ({ workout, onClose }) => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [mediaMap, setMediaMap] = useState<Record<string, MediaMapEntry>>({});
  
  const currentModule = workout?.modules?.[currentModuleIndex];
  const isLocal = currentModule?.displayId === LOCAL_DISPLAY_ID;

  const timerRef = useRef<number | null>(null);
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Map<string, any>>(new Map());
  const lastWorkoutId = useRef<string | null>(null);

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
          syncToAll(true); 
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

  // Pre-load all media for the entire workout to support multi-display
  useEffect(() => {
    const loadAllMedia = async () => {
      if (!workout?.modules || workout.id === lastWorkoutId.current) return;
      
      const newMediaMap: Record<string, MediaMapEntry> = {};
      const allAvailableExercises = [...MOCK_EXERCISES, ...storage.getCustomExercises()];
      const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');

      const uniqueExerciseIds = Array.from(new Set(workout.modules.map(m => m.exerciseId)));
      
      for (const exId of uniqueExerciseIds) {
        const baseEx = allAvailableExercises.find(ex => ex.id === exId);
        if (baseEx) {
          const finalEx = overrides[baseEx.id] || baseEx;
          const vBlob = await assetStorage.getAssetBlob(exId, 'video');
          const tBlob = await assetStorage.getAssetBlob(exId, 'thumbnail');
          
          newMediaMap[exId] = {
            exercise: finalEx,
            videoBlob: vBlob,
            thumbnailBlob: tBlob
          };
        }
      }
      
      setMediaMap(newMediaMap);
      lastWorkoutId.current = workout.id;
    };
    
    loadAllMedia();
  }, [workout]);

  const syncToAll = async (forceFullSync = false) => {
    if (!workout) return;

    connectionsRef.current.forEach((conn) => {
      if (conn && conn.open) {
        conn.send({
          type: 'GLOBAL_SYNC',
          payload: {
            workout,
            currentModuleIndex,
            timeLeft,
            isPaused,
            // Send the entire map so every TV can find its specific exercise
            mediaMap: forceFullSync || Object.keys(mediaMap).length > 0 ? mediaMap : null 
          }
        });
      }
    });
  };

  useEffect(() => {
    const loadLocalExercise = async () => {
      if (currentModule) {
        const entry = mediaMap[currentModule.exerciseId];
        if (entry) {
          setExercise(entry.exercise);
          const localUrl = await assetStorage.getAsset(entry.exercise.id, 'video');
          setLocalVideoUrl(localUrl);
          const moduleDuration = currentModule.duration ?? entry.exercise.duration ?? 0;
          setTimeLeft(moduleDuration);
        } else {
          // Fallback if map not ready
          const allEx = [...MOCK_EXERCISES, ...storage.getCustomExercises()];
          const ex = allEx.find(e => e.id === currentModule.exerciseId);
          if (ex) {
            setExercise(ex);
            const moduleDuration = currentModule.duration ?? ex.duration ?? 0;
            setTimeLeft(moduleDuration);
          }
        }
        setIsInitialLoading(false);
      }
    };
    loadLocalExercise();
  }, [currentModuleIndex, currentModule, mediaMap]);

  useEffect(() => {
    syncToAll();
  }, [timeLeft, isPaused, currentModuleIndex, workout, mediaMap]);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isInitialLoading) {
      if (workout?.modules && currentModuleIndex < workout.modules.length - 1) {
        setCurrentModuleIndex(prev => prev + 1);
      } else {
        setExercise(null);
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
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Preparing Assets...</p>
    </div>
  );

  if (!currentModule || !exercise) return (
    <div className="fixed inset-0 bg-[#1A1A1A] flex flex-col items-center justify-center p-8 text-white text-center">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 animate-bounce">
         <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">Session Done!</h2>
      <button onClick={onClose} className="w-full max-w-xs py-4 bg-[#E1523D] rounded-2xl font-black uppercase tracking-widest">Finish</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#1A1A1A] flex flex-col text-white overflow-hidden select-none z-[100]">
      <div className="h-20 shrink-0 px-6 flex items-center border-b border-white/5 bg-black/40 backdrop-blur-md">
        <button 
          onClick={onClose} 
          className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex-1 text-center px-4">
          <h3 className="text-[10px] font-black text-[#E1523D] uppercase tracking-[0.3em] leading-none mb-1">Workout Active</h3>
          <p className="font-bold text-sm truncate uppercase tracking-tighter italic">{workout.name}</p>
        </div>

        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 text-center">
        {isLocal ? (
          <div className="w-full flex flex-col items-center justify-center flex-1">
            <div className="relative w-full max-w-sm aspect-video rounded-[32px] overflow-hidden shadow-2xl bg-black border border-white/10 max-h-[35vh]">
              {(localVideoUrl || exercise.videoUrl) ? (
                <video src={localVideoUrl || exercise.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={exercise.thumbnail} className="w-full h-full object-cover opacity-80" alt={exercise.name} />
              )}
            </div>
            <div className="mt-6">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-tight">{exercise.name}</h2>
              <span className="text-[#E1523D] font-black uppercase tracking-[0.2em] text-[11px] mt-1 block">{exercise.category}</span>
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
              <h2 className="text-xl font-black uppercase italic tracking-widest text-white/90">Station Cast</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Display {currentModule.displayId} is active</p>
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
