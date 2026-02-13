
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
   */
  useEffect(() => {
    if (!syncData || !peerId) return;

    const { workout, currentModuleIndex, timeLeft } = syncData;
    const currentPhoneModule = workout.modules[currentModuleIndex];

    if (currentPhoneModule && currentPhoneModule.displayId === peerId) {
      if (activeModuleId !== currentPhoneModule.id) {
        setActiveModuleId(currentPhoneModule.id);
        setLocalTimeLeft(timeLeft);
      } else {
        if (Math.abs(localTimeLeft - timeLeft) > 2) {
          setLocalTimeLeft(timeLeft);
        }
      }
      return;
    }

    if (!activeModuleId) {
      const bestModule = 
        workout.modules.find((m, idx) => idx > currentModuleIndex && m.displayId === peerId) ||
        [...workout.modules].reverse().find(m => m.displayId === peerId);

      if (bestModule) {
        setActiveModuleId(bestModule.id);
        const baseEx = MOCK_EXERCISES.find(ex => ex.id === bestModule.exerciseId);
        setLocalTimeLeft(bestModule.duration ?? baseEx?.duration ?? 60);
      }
    }
  }, [syncData?.currentModuleIndex, syncData?.workout.id, peerId, syncData?.timeLeft]);

  if (!syncData) {
    return (
      <div className="h-screen w-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white p-12 text-center overflow-hidden">
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
      <div className="h-screen w-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white text-center p-12 overflow-hidden">
         <h2 className="text-4xl font-black uppercase italic mb-4 opacity-20">No Assignment</h2>
      </div>
    );
  }

  const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
  const exercise = overrides[exerciseBase.id] || exerciseBase;
  const isLocallyRunning = localTimeLeft > 0;
  const myGlobalIndex = workout.modules.findIndex(m => m.id === activeModuleId);
  const isCurrentlyInSync = myGlobalIndex === currentModuleIndex;

  return (
    <div className="h-screen w-screen bg-black flex flex-col text-white overflow-hidden select-none relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        {exercise.videoUrl ? (
          <video key={exercise.id} src={exercise.videoUrl} autoPlay loop muted className="w-full h-full object-cover opacity-30 blur-xl" />
        ) : (
          <img src={exercise.thumbnail} className="w-full h-full object-cover opacity-20 blur-2xl" alt="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-end pb-12 px-12">
        
        {/* Video Demonstration Area (ABOVE text) */}
        <div className="w-full max-w-5xl aspect-video bg-black rounded-[48px] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] mb-12 animate-in slide-in-from-top duration-700">
           {exercise.videoUrl ? (
             <video key={`demo-${exercise.id}`} src={exercise.videoUrl} autoPlay loop muted className="w-full h-full object-cover" />
           ) : (
             <img src={exercise.thumbnail} className="w-full h-full object-cover" alt={exercise.name} />
           )}
           {/* Overlays on Video */}
           {!isCurrentlyInSync && (
             <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-blue-600 px-8 py-4 rounded-full text-2xl font-black uppercase tracking-widest shadow-2xl">Up Next</div>
             </div>
           )}
        </div>

        {/* Content Area (BOTTOM CENTER) */}
        <div className="text-center w-full max-w-6xl animate-in fade-in slide-in-from-bottom duration-1000">
          <div className="mb-4">
            {!isLocallyRunning ? (
              <span className="bg-gray-800/80 backdrop-blur-md border border-white/20 px-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] inline-block shadow-2xl mb-6">Set Finished</span>
            ) : isCurrentlyInSync ? (
              <span className="bg-[#E1523D] border border-white/20 px-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] inline-block shadow-2xl mb-6 animate-pulse">Live Station</span>
            ) : (
               <span className="bg-blue-600/80 px-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] inline-block shadow-2xl mb-6">Preview Mode</span>
            )}
            
            <h2 className="text-[6vw] font-black uppercase italic tracking-tighter mb-2 leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              {exercise.name}
            </h2>
            <p className="text-[1.5vw] text-[#E1523D] font-black uppercase tracking-[0.5em] drop-shadow-lg opacity-80 mb-6">
              {exercise.category}
            </p>
          </div>

          {/* Large Timer Area */}
          <div className="relative inline-block">
            <div className={`text-[18vw] leading-none font-black italic tabular-nums drop-shadow-[0_15px_100px_rgba(0,0,0,0.9)] transition-all duration-300 ${isPaused && isCurrentlyInSync ? 'opacity-10 scale-90' : 'text-white'}`}>
              {localTimeLeft}
            </div>
            
            {isPaused && isCurrentlyInSync && (
              <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                 <div className="px-12 py-4 bg-white/10 backdrop-blur-xl text-white border-2 border-white/20 text-4xl font-black uppercase italic tracking-widest rounded-[24px] shadow-2xl">
                   Paused
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Progress Bar */}
      <div className="h-20 bg-black/90 backdrop-blur-2xl relative shrink-0 border-t border-white/5 z-20">
        <div 
          className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_50px_rgba(225,82,61,0.5)]"
          style={{ width: `${((currentModuleIndex + 1) / workout.modules.length) * 100}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-16 pointer-events-none">
          <div className="flex items-center gap-6">
            <span className="text-xl font-black uppercase italic tracking-widest text-white/30">
              {workout.name}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-black uppercase tracking-[0.8em] text-white">
              STATION PROGRESS
            </span>
            <span className="text-2xl font-black italic text-[#E1523D]">
              {currentModuleIndex + 1} <span className="text-white/20 text-lg not-italic mx-1">/</span> {workout.modules.length}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
            <span className="text-xs font-mono font-bold text-white/20 tracking-widest">
              DEVICE: {peerId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
