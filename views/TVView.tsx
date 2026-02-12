
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
        }
      });
    });

    return () => {
      peer.destroy();
    };
  }, []);

  // Waiting screen when no workout is casting to this display
  if (!syncData) {
    return (
      <div className="h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white p-12 text-center">
        <div className="w-32 h-32 mb-8 border-4 border-[#E1523D]/20 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 border-4 border-[#E1523D] rounded-full border-t-transparent animate-spin" />
          <svg className="w-12 h-12 text-[#E1523D]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
        </div>
        
        <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4">Display Ready</h1>
        <p className="text-gray-400 max-w-md text-xl mb-12">
          Enter this Pairing ID on your phone to link this display.
        </p>

        <div className="bg-white text-black px-12 py-6 rounded-3xl shadow-2xl">
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Your Pairing ID</p>
          <div className="text-7xl font-black tracking-widest font-mono">
            {peerId || '...'}
          </div>
        </div>

        <div className="mt-16 flex items-center gap-4 text-gray-500 text-sm font-bold uppercase tracking-widest">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           P2P Engine Active
        </div>
      </div>
    );
  }

  const { workout, currentModuleIndex, timeLeft, isPaused } = syncData;
  const currentModule = workout.modules[currentModuleIndex];
  
  // Is this TV the 'Active' one for the current module selected on the phone?
  const isActiveTarget = currentModule.displayId === peerId;
  
  /**
   * Find the most relevant module for this display.
   */
  const myModules = workout.modules.map((m, index) => ({ ...m, index }));
  const myAssignedModules = myModules.filter(m => m.displayId === peerId);
  
  // Find the module that is either currently active, or the next one to become active
  let myAssignedModule = myAssignedModules.find(m => m.index === currentModuleIndex);
  let status: 'ACTIVE' | 'UPCOMING' | 'FINISHED' = 'ACTIVE';

  if (!myAssignedModule) {
    // If none are currently active, find the first upcoming one
    myAssignedModule = myAssignedModules.find(m => m.index > currentModuleIndex);
    status = 'UPCOMING';
    
    // If no upcoming ones, find the last finished one
    if (!myAssignedModule && myAssignedModules.length > 0) {
      myAssignedModule = myAssignedModules[myAssignedModules.length - 1];
      status = 'FINISHED';
    }
  }

  const exerciseBase = myAssignedModule ? MOCK_EXERCISES.find(ex => ex.id === myAssignedModule.exerciseId) : null;
  
  // If this TV isn't assigned to ANY module in the current workout
  if (!exerciseBase || !myAssignedModule) {
    return (
      <div className="h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white text-center p-12">
         <h2 className="text-4xl font-black uppercase italic mb-4 opacity-20">No Assignment</h2>
         <p className="text-gray-500 font-bold uppercase tracking-widest">This display is not part of the active workout session.</p>
      </div>
    );
  }

  // Check for AI overrides
  const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
  const exercise = overrides[exerciseBase.id] || exerciseBase;

  // DECIDE WHAT TIMER TO SHOW
  // If active: show the phone's timer
  // If upcoming: show the module's full duration
  // If finished: show 0
  let displayTime = 0;
  if (status === 'ACTIVE') {
    displayTime = timeLeft;
  } else if (status === 'UPCOMING') {
    displayTime = myAssignedModule.duration ?? exercise.duration;
  } else if (status === 'FINISHED') {
    displayTime = 0;
  }

  return (
    <div className="h-screen bg-black flex flex-col text-white overflow-hidden">
      <div className="flex-1 relative">
        {/* Background Media */}
        {exercise.videoUrl ? (
          <video 
            key={exercise.id}
            src={exercise.videoUrl} 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover opacity-100"
          />
        ) : (
          <img 
            src={exercise.thumbnail} 
            className="w-full h-full object-cover opacity-100" 
            alt={exercise.name} 
          />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-12 flex flex-col justify-end items-center text-center">
           <div className="mb-8">
              {status === 'UPCOMING' && (
                <div className="mb-4">
                  <span className="bg-[#E1523D] border border-white/40 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] inline-block shadow-lg animate-pulse">
                    Up Next
                  </span>
                </div>
              )}
              {status === 'FINISHED' && (
                <div className="mb-4">
                  <span className="bg-gray-600 border border-white/40 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] inline-block shadow-lg">
                    Completed
                  </span>
                </div>
              )}
              <h2 className="text-9xl font-black uppercase italic tracking-tighter mb-2 leading-none drop-shadow-2xl">
                {exercise.name}
              </h2>
              <p className="text-4xl text-[#E1523D] font-black uppercase tracking-[0.4em] drop-shadow-md">
                {exercise.category}
              </p>
           </div>
           
           <div className="relative mb-8">
              <div className={`text-[20rem] leading-none font-black italic tabular-nums drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)] ${isPaused && status === 'ACTIVE' ? 'opacity-30' : 'text-white'}`}>
                {displayTime}
              </div>
              {isPaused && status === 'ACTIVE' && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="px-16 py-8 bg-white text-black text-6xl font-black uppercase italic tracking-widest rounded-[40px] shadow-2xl">
                     Paused
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
      
      {/* Global Progress Bar */}
      <div className="h-10 bg-white/10 relative">
        <div 
          className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_50px_rgba(225,82,61,1)]"
          style={{ width: `${((currentModuleIndex + 1) / workout.modules.length) * 100}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-black uppercase tracking-[0.6em] text-white">
            Workout Progress: {currentModuleIndex + 1} / {workout.modules.length}
          </span>
        </div>
      </div>
    </div>
  );
};
