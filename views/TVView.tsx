
import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Workout, WorkoutModule } from '../types';
import { MOCK_EXERCISES } from '../constants';
import { assetStorage } from '../services/assetStorage';

export const TVView: React.FC = () => {
  const [syncData, setSyncData] = useState<{ 
    workout: Workout; 
    currentModuleIndex: number; 
    timeLeft: number; 
    isPaused: boolean;
    localVideoBlob?: Blob;
  } | null>(null);
  
  const [peerId, setPeerId] = useState<string>('');
  const [localTimeLeft, setLocalTimeLeft] = useState<number>(0);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    // @ts-ignore
    const peer = new Peer(randomId);
    peerRef.current = peer;
    peer.on('open', (id: string) => setPeerId(id));
    peer.on('connection', (conn: any) => {
      conn.on('data', (data: any) => {
        if (data.type === 'GLOBAL_SYNC') {
          setSyncData(data.payload);
        } else if (data.type === 'END_SESSION') {
          setSyncData(null);
          setActiveModuleId(null);
          setLocalTimeLeft(0);
          setLocalVideoUrl(null);
        }
      });
    });
    return () => peer.destroy();
  }, []);

  useEffect(() => {
    let interval: number;
    if (syncData && !syncData.isPaused && localTimeLeft > 0) {
      interval = window.setInterval(() => {
        setLocalTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [syncData?.isPaused, localTimeLeft > 0]);

  useEffect(() => {
    if (!syncData || !peerId) return;
    const { workout, currentModuleIndex, timeLeft, localVideoBlob } = syncData;
    const currentPhoneModule = workout.modules[currentModuleIndex];

    if (currentPhoneModule && currentPhoneModule.displayId === peerId) {
      if (activeModuleId !== currentPhoneModule.id) {
        setActiveModuleId(currentPhoneModule.id);
        setLocalTimeLeft(timeLeft);
        
        // Handle incoming blob from phone
        if (localVideoBlob instanceof Blob) {
          if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
          setLocalVideoUrl(URL.createObjectURL(localVideoBlob));
        } else {
          // Check local IndexedDB if Phone didn't send Blob (optional)
          assetStorage.getAsset(currentPhoneModule.exerciseId, 'video').then(url => setLocalVideoUrl(url));
        }
      } else {
        if (Math.abs(localTimeLeft - timeLeft) > 2) setLocalTimeLeft(timeLeft);
      }
    }
  }, [syncData?.currentModuleIndex, syncData?.workout.id, peerId, syncData?.timeLeft]);

  if (!syncData) return (
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

  const { workout, currentModuleIndex, isPaused } = syncData;
  const myModule = workout.modules.find(m => m.id === activeModuleId);
  const exerciseBase = myModule ? MOCK_EXERCISES.find(ex => ex.id === myModule.exerciseId) : null;
  
  if (!exerciseBase || !myModule) return (
    <div className="h-screen w-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white text-center p-12 overflow-hidden">
       <h2 className="text-4xl font-black uppercase italic mb-4 opacity-20">No Assignment</h2>
    </div>
  );

  const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
  const exercise = overrides[exerciseBase.id] || exerciseBase;
  const isCurrentlyInSync = workout.modules.findIndex(m => m.id === activeModuleId) === currentModuleIndex;

  return (
    <div className="h-screen w-screen bg-black flex flex-col text-white overflow-hidden select-none relative">
      <div className="absolute inset-0 z-0">
        {(localVideoUrl || exercise.videoUrl) ? (
          <video key={exercise.id} src={localVideoUrl || exercise.videoUrl} autoPlay loop muted className="w-full h-full object-cover opacity-20 blur-3xl" />
        ) : (
          <img src={exercise.thumbnail} className="w-full h-full object-cover opacity-10 blur-2xl" alt="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/90" />
      </div>

      <div className="flex-1 relative z-10 flex flex-col items-center justify-center py-2 px-8 overflow-hidden">
        {/* TOP: Video Demonstration Area */}
        <div className="w-full max-w-4xl max-h-[40vh] aspect-video bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative flex-shrink">
           {(localVideoUrl || exercise.videoUrl) ? (
             <video key={`demo-${exercise.id}`} src={localVideoUrl || exercise.videoUrl} autoPlay loop muted className="w-full h-full object-contain" />
           ) : (
             <img src={exercise.thumbnail} className="w-full h-full object-contain" alt={exercise.name} />
           )}
           {/* Dimming overlay for inactive stations - text removed */}
           {!isCurrentlyInSync && (
             <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-500" />
           )}
        </div>

        {/* BOTTOM OFFSET: Content Area - Cleaned up status labels */}
        <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mt-4 animate-in fade-in slide-in-from-bottom duration-1000 overflow-hidden">
          <div className="mb-1">
            <h2 className="text-[2.8vw] lg:text-3xl font-black uppercase italic tracking-tighter mb-0.5 leading-none drop-shadow-2xl truncate w-full px-4">{exercise.name}</h2>
            <p className="text-[0.8vw] lg:text-sm text-[#E1523D] font-black uppercase tracking-[0.3em] drop-shadow-md opacity-80 mb-1">{exercise.category}</p>
          </div>

          {/* Timer Area - Simplified */}
          <div className="relative inline-block flex-shrink">
            <div className={`text-[4vw] lg:text-[4.5rem] leading-none font-black italic tabular-nums drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 ${isPaused && isCurrentlyInSync ? 'opacity-10 scale-90' : 'text-white'}`}>
              {localTimeLeft}
            </div>
            {isPaused && isCurrentlyInSync && (
              <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                 <div className="px-4 py-1 bg-white/10 backdrop-blur-2xl text-white border border-white/20 text-sm font-black uppercase italic tracking-widest rounded-lg shadow-2xl">Paused</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Progress Bar */}
      <div className="h-12 bg-[#0A0A0A]/95 backdrop-blur-3xl relative shrink-0 border-t border-white/5 z-20">
        <div className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_30px_rgba(225,82,61,0.3)]" style={{ width: `${((currentModuleIndex + 1) / workout.modules.length) * 100}%` }} />
        <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none">
          <span className="text-xs font-black uppercase italic tracking-widest text-white/30 truncate max-w-[120px]">{workout.name}</span>
          <div className="flex flex-col items-center justify-center">
            <span className="text-[6px] font-black uppercase tracking-[0.6em] text-white/60 mb-0.5">STATION PROGRESS</span>
            <span className="text-sm font-black italic text-[#E1523D] leading-none">{currentModuleIndex + 1} <span className="text-white/20 text-[10px] not-italic mx-0.5">/</span> {workout.modules.length}</span>
          </div>
          <span className="text-[7px] font-mono font-bold text-white/20 tracking-widest uppercase">ID: {peerId}</span>
        </div>
      </div>
    </div>
  );
};
