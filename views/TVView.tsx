import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Workout } from '../types';
import { MOCK_EXERCISES } from '../constants';
import { storage } from '../services/storage';

export const TVView: React.FC = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [stationAlias, setStationAlias] = useState<string>(localStorage.getItem('cf_tv_alias') || '');
  const [localTimeLeft, setLocalTimeLeft] = useState<number>(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [globalWorkout, setGlobalWorkout] = useState<Workout | null>(null);
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  
  const endTimeRef = useRef<number>(0);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    // @ts-ignore
    const peer = new Peer(randomId);
    peerRef.current = peer;
    peer.on('open', (id: string) => setPeerId(id));
    
    peer.on('connection', (conn: any) => {
      conn.on('data', (data: any) => {
        if (data.type === 'HEARTBEAT') {
          const { workout, currentModuleIndex: hostIdx, endTime: hostEndTime, isPaused: hostPaused } = data.payload;
          
          if (workout) setGlobalWorkout(workout);
          setCurrentModuleIndex(hostIdx);
          setIsPaused(hostPaused);
          endTimeRef.current = hostEndTime;
          
          const remaining = Math.max(0, Math.ceil((hostEndTime - Date.now()) / 1000));
          setLocalTimeLeft(remaining);
        } else if (data.type === 'END_SESSION') {
          setGlobalWorkout(null);
          setLocalTimeLeft(0);
        }
      });
    });
    
    return () => peer.destroy();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!globalWorkout || isPaused) return;
      
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setLocalTimeLeft(remaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [globalWorkout, isPaused]);

  const myPeerId = peerId.toUpperCase().trim();
  const myAlias = stationAlias.toUpperCase().trim();

  const isMe = (dId: string) => {
    if (!dId) return false;
    const cleanId = dId.toUpperCase().trim();
    return cleanId === myPeerId || (myAlias && cleanId === myAlias);
  };

  const currentModule = globalWorkout?.modules?.[currentModuleIndex];
  const isMyTurn = currentModule ? isMe(currentModule.displayId) : false;

  const myNextModule = globalWorkout?.modules?.slice(currentModuleIndex).find(m => isMe(m.displayId));
  const activeModule = isMyTurn ? currentModule : myNextModule;

  const exercise = activeModule 
    ? [...MOCK_EXERCISES, ...storage.getCustomExercises()].find(ex => ex.id === activeModule.exerciseId) 
    : null;

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

  if (!globalWorkout) return (
    <div className="h-screen w-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white p-12 text-center overflow-hidden">
      <div className="w-32 h-32 mb-12 border-4 border-[#E1523D]/20 rounded-full flex items-center justify-center relative scale-110">
        <div className="absolute inset-0 border-4 border-[#E1523D] rounded-full border-t-transparent animate-spin" />
        <svg className="w-12 h-12 text-[#E1523D]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 10h2v2H5v-2zm12 0h2v2h-2v-2zm-6 0h2v2h-2v-2z"/></svg>
      </div>
      <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-12 text-white/90">Display Ready</h1>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl px-4">
        <div className="flex-1 bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl transition-all hover:bg-white/[0.08]">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Pairing ID</p>
          <div className="text-5xl font-black tracking-widest font-mono text-[#E1523D]">{peerId || '...'}</div>
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl group cursor-pointer transition-all hover:bg-white/[0.08]" onClick={() => setIsEditingAlias(true)}>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Station Name (Alias)</p>
          {isEditingAlias ? (
            <input 
              autoFocus
              className="w-full bg-white text-black text-3xl font-black rounded-2xl px-6 py-4 outline-none"
              defaultValue={stationAlias}
              onBlur={(e) => saveAlias(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveAlias((e.target as HTMLInputElement).value)}
            />
          ) : (
            <div className="text-5xl font-black tracking-widest text-white group-hover:text-[#E1523D] transition-colors">
              {stationAlias || 'SET NAME'}
            </div>
          )}
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mt-4">Example: STATION 1</p>
        </div>
      </div>
      <p className="mt-16 text-gray-600 font-black uppercase tracking-[0.4em] text-sm animate-pulse">Waiting for Host...</p>
    </div>
  );

  if (!exercise) return (
    <div className="h-screen w-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white text-center p-12">
       <div className="w-24 h-24 mb-8 opacity-10">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 10h2v2H5v-2zm12 0h2v2h-2v-2zm-6 0h2v2h-2v-2z"/></svg>
       </div>
       <h2 className="text-5xl font-black uppercase italic mb-4 tracking-tighter text-white/30">Station Idle</h2>
       <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-600 max-w-md leading-relaxed">
         The station <span className="text-[#E1523D]">{stationAlias || peerId}</span> is not assigned in the current workout: <br/> 
         <span className="text-white/40 italic">"{globalWorkout.name}"</span>
       </p>
       <button onClick={() => setGlobalWorkout(null)} className="mt-12 text-xs font-black text-[#E1523D] border-2 border-[#E1523D]/20 px-10 py-4 rounded-full">EXIT</button>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-black flex flex-col text-white overflow-hidden select-none relative animate-in fade-in duration-500">
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center py-4 px-12 overflow-hidden">
        {isMyTurn ? (
          <div className="flex flex-col items-center w-full animate-in zoom-in duration-700">
            <div className="w-full max-w-6xl max-h-[58vh] aspect-video bg-black rounded-[48px] overflow-hidden border border-white/5 shadow-2xl relative">
               <video key={exercise.id} src={exercise.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
            </div>
            <div className="mt-12 text-center">
               <h2 className="text-[5vw] font-black uppercase italic tracking-tighter leading-none mb-4">{exercise.name}</h2>
               <div className="flex items-center justify-center gap-4 mb-8">
                  <span className="text-[1.5vw] text-[#E1523D] font-black uppercase tracking-[0.4em] opacity-90">{stationAlias || peerId}</span>
                  <div className="w-2 h-2 rounded-full bg-[#E1523D] animate-pulse"></div>
                  <span className="text-[1.5vw] text-white/40 font-black uppercase tracking-[0.4em]">ACTIVE</span>
               </div>
               <div className="relative inline-block">
                 <div className={`text-[12vw] leading-none font-black italic tabular-nums transition-all ${isPaused ? 'opacity-20 scale-95 blur-sm' : 'text-white'}`}>
                   {formatTimeDisplay(localTimeLeft)}
                 </div>
                 {isPaused && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-16 py-6 bg-[#E1523D] text-white text-3xl font-black uppercase italic tracking-widest rounded-[32px] shadow-2xl animate-pulse">PAUSED</div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-5xl animate-in fade-in duration-1000">
            <div className="w-40 h-40 rounded-full border-8 border-white/[0.03] flex items-center justify-center mb-12 bg-white/[0.02]">
               <svg className="w-16 h-16 text-white/10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </div>
            <span className="text-[#E1523D] font-black uppercase tracking-[0.6em] text-2xl mb-6">Resting</span>
            <h3 className="text-7xl font-black uppercase italic tracking-tighter text-white/50 mb-16 leading-tight">Next Up: <br/><span className="text-white/80">{exercise.name}</span></h3>
            <div className="bg-white/[0.03] border border-white/10 rounded-[50px] p-12 backdrop-blur-3xl shadow-2xl">
               <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Workout Timer</p>
               <div className="text-[10vw] leading-none font-black italic tabular-nums opacity-60 text-white tracking-tighter">{formatTimeDisplay(localTimeLeft)}</div>
            </div>
          </div>
        )}
      </div>
      <div className="h-28 bg-[#050505] relative shrink-0 border-t border-white/5 z-20 overflow-hidden">
        <div className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear" style={{ width: `${((currentModuleIndex + 1) / globalWorkout.modules.length) * 100}%` }} />
        <div className="absolute inset-0 flex items-center justify-between px-20 pointer-events-none">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">SESSION</span>
            <span className="text-2xl font-black uppercase italic tracking-tight text-white/60 truncate max-w-[400px]">{globalWorkout.name}</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-2">PROGRESS</span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black italic text-white leading-none">{currentModuleIndex + 1}</span>
              <span className="text-white/20 text-2xl font-black">/</span> 
              <span className="text-3xl font-black italic text-white/30">{globalWorkout.modules.length}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">ID</span>
            <span className="text-2xl font-mono font-bold text-[#E1523D] uppercase tracking-wider">{stationAlias || peerId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
