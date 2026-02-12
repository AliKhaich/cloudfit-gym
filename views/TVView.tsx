
import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Workout, WorkoutModule } from '../types';
import { MOCK_EXERCISES } from '../constants';

export const TVView: React.FC = () => {
  const [syncData, setSyncData] = useState<{ 
    workout: Workout; 
    currentModuleIndex: number; 
    timeLeft: number; 
    isPaused: boolean 
  } | null>(null);
  
  const [peerId, setPeerId] = useState<string>('');
  const [localTimeLeft, setLocalTimeLeft] = useState<number>(0);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    // Generate a short 6-char random ID for easy pairing
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // @ts-ignore
    const peer = new Peer(randomId);
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      setPeerId(id);
    });

    peer.on('connection', (conn: any) => {
      conn.on('data', (data: any) => {
        if (data.type === 'GLOBAL_SYNC') {
          setSyncData(data.payload);
        } else if (data.type === 'END_SESSION') {
          setSyncData(null);
          setActiveModuleId(null);
          setLocalTimeLeft(0);
        }
      });
    });

    return () => {
      peer.destroy();
    };
  }, []);

  /**
   * Independent Local Timer
   * Only stops if sync says paused or hits zero.
   */
  useEffect(() => {
    let interval: number;
    if (syncData && !syncData.isPaused && localTimeLeft > 0) {
      interval = window.setInterval(() => {
        setLocalTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [syncData?.isPaused, localTimeLeft > 0]);

  /**
   * Refined Sync Logic
   * Decouples the TV's focus from the phone's focus.
   */
  useEffect(() => {
    if (!syncData || !peerId) return;

    const { workout, currentModuleIndex, timeLeft } = syncData;
    const currentPhoneModule = workout.modules[currentModuleIndex];

    // Rule 1: If the phone is CURRENTLY on a module for this TV, we MUST sync.
    if (currentPhoneModule && currentPhoneModule.displayId === peerId) {
      if (activeModuleId !== currentPhoneModule.id) {
        // Switch to the phone's active module
        setActiveModuleId(currentPhoneModule.id);
        setLocalTimeLeft(timeLeft);
      } else {
        // Minor sync for drift (only if on same module)
        if (Math.abs(localTimeLeft - timeLeft) > 2) {
          setLocalTimeLeft(timeLeft);
        }
      }
      return;
    }

    // Rule 2: If the phone is on a module for a DIFFERENT TV, 
    // we only change the TV's state if we don't have one yet.
    if (!activeModuleId) {
      // Find the first relevant module for this TV (next one or most recent)
      const bestModule = 
        workout.modules.find((m, idx) => idx > currentModuleIndex && m.displayId === peerId) ||
        [...workout.modules].reverse().find(m => m.displayId === peerId);

      if (bestModule) {
        setActiveModuleId(bestModule.id);
        const baseEx = MOCK_EXERCISES.find(ex => ex.id === bestModule.exerciseId);
        setLocalTimeLeft(bestModule.duration ?? baseEx?.duration ?? 60);
      }
    }

    // Rule 3: If we ALREADY have an active module and Rule 1 didn't trigger,
    // we just let our local timer keep running. We don't change anything.
    // This prevents the timer from jumping to 0 when the phone moves to station B.

  }, [syncData?.currentModuleIndex, syncData?.workout.id, peerId, syncData?.timeLeft]);

  // Handle waiting screen
  if (!syncData) {
    return (
      <div className="h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white p-12 text-center">
        <div className="w-32 h-32 mb-8 border-4 border-[#E1523D]/20 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 border-4 border-[#E1523D] rounded-full border-t-transparent animate-spin" />
          <svg className="w-12 h-12 text-[#E1523D]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
        </div>
        <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4">Display Ready</h1>
        <div className="bg-white text-black px-12 py-6 rounded-3xl shadow-2xl">
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Pairing ID</p>
          <div className="text-7xl font-black tracking-widest font-mono">{peerId || '...'}</div>
        </div>
      </div>
    );
  }

  const { workout, currentModuleIndex, isPaused } = syncData;
  const myModule = workout.modules.find(m => m.id === activeModuleId);
  const exerciseBase = myModule ? MOCK_EXERCISES.find(ex => ex.id === myModule.exerciseId) : null;
  
  if (!exerciseBase || !myModule) {
    return (
      <div className="h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white text-center p-12">
         <h2 className="text-4xl font-black uppercase italic mb-4 opacity-20">No Assignment</h2>
      </div>
    );
  }

  const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
  const exercise = overrides[exerciseBase.id] || exerciseBase;

  // Determine actual visual status based on local timer vs phone index
  const myGlobalIndex = workout.modules.findIndex(m => m.id === activeModuleId);
  const isCurrentlyInSync = myGlobalIndex === currentModuleIndex;
  
  // A module is "active" if its local timer is still running
  const isLocallyRunning = localTimeLeft > 0;

  return (
    <div className="h-screen bg-black flex flex-col text-white overflow-hidden">
      <div className="flex-1 relative">
        {exercise.videoUrl ? (
          <video key={exercise.id} src={exercise.videoUrl} autoPlay loop muted className="w-full h-full object-cover opacity-100" />
        ) : (
          <img src={exercise.thumbnail} className="w-full h-full object-cover opacity-100" alt={exercise.name} />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent p-12 flex flex-col justify-end items-center text-center">
           <div className="mb-8">
              {!isLocallyRunning ? (
                <span className="bg-gray-600 border border-white/40 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] inline-block shadow-lg mb-4">Set Finished</span>
              ) : !isCurrentlyInSync ? (
                <span className="bg-blue-600 border border-white/40 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] inline-block shadow-lg mb-4">Completing Set</span>
              ) : (
                <span className="bg-green-600 border border-white/40 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] inline-block shadow-lg mb-4">Your Station</span>
              )}
              <h2 className="text-9xl font-black uppercase italic tracking-tighter mb-2 leading-none drop-shadow-2xl">{exercise.name}</h2>
              <p className="text-4xl text-[#E1523D] font-black uppercase tracking-[0.4em] drop-shadow-md">{exercise.category}</p>
           </div>
           
           <div className="relative mb-8">
              <div className={`text-[24rem] leading-none font-black italic tabular-nums drop-shadow-[0_10px_60px_rgba(0,0,0,0.8)] ${isPaused && isCurrentlyInSync ? 'opacity-30' : 'text-white'}`}>
                {localTimeLeft}
              </div>
              {isPaused && isCurrentlyInSync && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="px-16 py-8 bg-white text-black text-6xl font-black uppercase italic tracking-widest rounded-[40px] shadow-2xl">Paused</div>
                </div>
              )}
           </div>
        </div>
      </div>
      
      <div className="h-12 bg-white/10 relative">
        <div 
          className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_50px_rgba(225,82,61,1)]"
          style={{ width: `${((currentModuleIndex + 1) / workout.modules.length) * 100}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-black uppercase tracking-[0.8em] text-white drop-shadow-md">
            GLOBAL PROGRESS: {currentModuleIndex + 1} / {workout.modules.length}
          </span>
        </div>
      </div>
    </div>
  );
};
