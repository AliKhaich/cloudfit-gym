
import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Workout } from '../types';
import { STATIC_EXERCISES } from '../constants';
import { storage } from '../services/storage';

export const TVView: React.FC = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [stationAlias, setStationAlias] = useState<string>(localStorage.getItem('cf_tv_alias') || '');
  const [localTimeLeft, setLocalTimeLeft] = useState<number>(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [globalWorkout, setGlobalWorkout] = useState<Workout | null>(null);
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  
  const peerRef = useRef<any>(null);

  // Initialize TV Peer
  useEffect(() => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    // @ts-ignore
    const peer = new Peer(randomId);
    peerRef.current = peer;
    peer.on('open', (id: string) => setPeerId(id));
    
    peer.on('connection', (conn: any) => {
      conn.on('data', (data: any) => {
        if (data.type === 'HEARTBEAT') {
          const { workout, currentModuleIndex, timeLeft, isPaused } = data.payload;
          
          // CRITICAL: Ensure we don't clear the workout if heartbeat is malformed
          if (workout) {
            setGlobalWorkout(workout);
          }
          
          setCurrentModuleIndex(currentModuleIndex);
          setIsPaused(isPaused);
          
          // Sync timer if it drifts more than 2 seconds
          if (Math.abs(localTimeLeft - timeLeft) > 2) {
            setLocalTimeLeft(timeLeft);
          }
        } else if (data.type === 'END_SESSION') {
          setGlobalWorkout(null);
          setLocalTimeLeft(0);
        }
      });
    });
    
    return () => peer.destroy();
  }, [localTimeLeft]);

  // Smooth local timer interpolation
  useEffect(() => {
    let interval: number;
    if (globalWorkout && !isPaused && localTimeLeft > 0) {
      interval = window.setInterval(() => {
        setLocalTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, localTimeLeft > 0, globalWorkout]);

  const saveAlias = (val: string) => {
    const clean = val.toUpperCase().trim();
    setStationAlias(clean);
    localStorage.setItem('cf_tv_alias', clean);
    setIsEditingAlias(false);
  };

  const formatTimeDisplay = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m === 0) return s;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. Initial State: Waiting for connection
  if (!globalWorkout) return (
    <div className="h-screen w-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white p-12 text-center overflow-hidden">
      <div className="w-24 h-24 mb-8 border-4 border-[#E1523D]/20 rounded-full flex items-center justify-center relative">
        <div className="absolute inset-0 border-4 border-[#E1523D] rounded-full border-t-transparent animate-spin" />
        <svg className="w-10 h-10 text-[#E1523D]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 10h2v2H5v-2zm12 0h2v2h-2v-2zm-6 0h2v2h-2v-2z"/></svg>
      </div>
      
      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8">Display Ready</h1>
      
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        <div className="flex-1 bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Pairing ID (Technical)</p>
          <div className="text-4xl font-black tracking-widest font-mono text-[#E1523D]">{peerId || '...'}</div>
        </div>

        <div className="flex-1 bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl group cursor-pointer" onClick={() => setIsEditingAlias(true)}>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Station Name (Alias)</p>
          {isEditingAlias ? (
            <input 
              autoFocus
              className="w-full bg-white text-black text-2xl font-black rounded-xl px-4 py-2 outline-none"
              defaultValue={stationAlias}
              onBlur={(e) => saveAlias(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveAlias((e.target as HTMLInputElement).value)}
            />
          ) : (
            <div className="text-4xl font-black tracking-widest text-white group-hover:text-[#E1523D] transition-colors">
              {stationAlias || 'SET NAME'}
            </div>
          )}
          <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-2">Example: STATION 1</p>
        </div>
      </div>

      <p className="mt-12 text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Waiting for Host...</p>
    </div>
  );

  // 2. Logic: ID Normalization
  const myPeerId = peerId.toUpperCase().trim();
  const myAlias = stationAlias.toUpperCase().trim();

  const currentGlobalModule = globalWorkout.modules[currentModuleIndex];
  
  // Check if current module matches this display
  const targetId = currentGlobalModule?.displayId?.toUpperCase().trim();
  const isMyTurn = targetId === myPeerId || (myAlias && targetId === myAlias);
  
  // Scan ahead to find my next module if it's not my turn
  const myNextModule = globalWorkout.modules.slice(currentModuleIndex).find(m => {
    const dId = m.displayId?.toUpperCase().trim();
    return dId === myPeerId || (myAlias && dId === myAlias);
  });

  const activeModule = isMyTurn ? currentGlobalModule : myNextModule;
  const exercise = activeModule ? [...STATIC_EXERCISES, ...storage.getCustomExercises()].find(ex => ex.id === activeModule.exerciseId) : null;

  if (!exercise) return (
    <div className="h-screen w-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white text-center p-12">
       <div className="w-20 h-20 mb-6 opacity-20">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 10h2v2H5v-2zm12 0h2v2h-2v-2zm-6 0h2v2h-2v-2z"/></svg>
       </div>
       <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter text-white/40">Station Idle</h2>
       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 max-w-xs">
         This station ({stationAlias || peerId}) is not assigned in the current workout.
       </p>
       <button onClick={() => setGlobalWorkout(null)} className="mt-8 text-[10px] font-bold text-[#E1523D] border border-[#E1523D]/20 px-6 py-2 rounded-full">RESET CONNECTION</button>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-black flex flex-col text-white overflow-hidden select-none relative">
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center py-2 px-8 overflow-hidden">
        
        {isMyTurn ? (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-5xl max-h-[55vh] aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative">
               <video 
                 key={`video-${exercise.id}`} 
                 src={exercise.videoUrl} 
                 autoPlay loop muted playsInline className="w-full h-full object-contain" 
               />
            </div>
            <div className="mt-10 text-center animate-in fade-in slide-in-from-bottom duration-700">
               <h2 className="text-[4vw] font-black uppercase italic tracking-tighter leading-none mb-2 drop-shadow-2xl">{exercise.name}</h2>
               <p className="text-[1.2vw] text-[#E1523D] font-black uppercase tracking-[0.4em] opacity-90 mb-6 uppercase">STATION: {stationAlias || peerId}</p>
               
               <div className="relative inline-block">
                 <div className={`text-[10vw] leading-none font-black italic tabular-nums transition-all duration-300 ${isPaused ? 'opacity-20 scale-90' : 'text-white'}`}>
                   {formatTimeDisplay(localTimeLeft)}
                 </div>
                 {isPaused && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-12 py-4 bg-[#E1523D] text-white text-2xl font-black uppercase italic tracking-widest rounded-3xl shadow-2xl animate-pulse">PAUSED</div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-4xl animate-in zoom-in duration-1000">
            <div className="w-32 h-32 rounded-full border-4 border-white/5 flex items-center justify-center mb-8">
               <svg className="w-12 h-12 text-white/20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </div>
            <span className="text-[#E1523D] font-black uppercase tracking-[0.5em] text-xl mb-4">Station Resting</span>
            <h3 className="text-6xl font-black uppercase italic tracking-tighter text-white/40 mb-12">Next Up: {exercise.name}</h3>
            
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-md">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Global Timer</p>
               <div className="text-8xl font-black italic tabular-nums opacity-80">{formatTimeDisplay(localTimeLeft)}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Info Bar */}
      <div className="h-24 bg-[#0A0A0A] relative shrink-0 border-t border-white/5 z-20 overflow-hidden">
        <div className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_50px_rgba(225,82,61,0.5)]" style={{ width: `${((currentModuleIndex + 1) / globalWorkout.modules.length) * 100}%` }} />
        <div className="absolute inset-0 flex items-center justify-between px-16 pointer-events-none">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">WORKOUT</span>
            <span className="text-xl font-black uppercase italic tracking-tight text-white/50 truncate max-w-[300px]">{globalWorkout.name}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30 mb-1">GLOBAL ROUND</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic text-white leading-none">{currentModuleIndex + 1}</span>
              <span className="text-white/20 text-xl font-black">/</span> 
              <span className="text-2xl font-black italic text-white/30">{globalWorkout.modules.length}</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">DISPLAY</span>
            <span className="text-xl font-mono font-bold text-white/40 uppercase">{stationAlias || peerId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
