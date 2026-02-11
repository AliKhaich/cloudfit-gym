
import React, { useState, useEffect, useRef } from 'react';
import { Exercise } from '../types';

export const TVView: React.FC = () => {
  const [session, setSession] = useState<{ exercise: Exercise; timeLeft: number; isPaused: boolean } | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const peerRef = useRef<any>(null);

  useEffect(() => {
    // Generate a short 6-char random ID for easy typing
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // @ts-ignore
    const peer = new Peer(randomId);
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      setPeerId(id);
    });

    peer.on('connection', (conn: any) => {
      conn.on('data', (data: any) => {
        if (data.type === 'SYNC_STATE') {
          setSession(data.payload);
        } else if (data.type === 'END_SESSION') {
          setSession(null);
        }
      });
    });

    return () => {
      peer.destroy();
    };
  }, []);

  if (!session) {
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

  const { exercise, timeLeft, isPaused } = session;

  return (
    <div className="h-screen bg-black flex flex-col text-white animate-in fade-in duration-500 overflow-hidden">
      <div className="flex-1 relative">
        {exercise.videoUrl ? (
          <video 
            src={exercise.videoUrl} 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={exercise.thumbnail} className="w-full h-full object-cover opacity-40 blur-xl" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end items-center text-center">
           <div className="mb-8">
              <h2 className="text-8xl font-black uppercase italic tracking-tighter mb-2">{exercise.name}</h2>
              <p className="text-3xl text-[#E1523D] font-black uppercase tracking-[0.3em]">{exercise.category}</p>
           </div>
           
           <div className="relative">
              <div className={`text-[15rem] leading-none font-black italic tabular-nums ${isPaused ? 'opacity-20' : 'text-white'}`}>
                {timeLeft}
              </div>
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="px-16 py-8 bg-white text-black text-5xl font-black uppercase italic tracking-widest rounded-[40px] shadow-2xl">Paused</div>
                </div>
              )}
           </div>
        </div>
      </div>
      
      <div className="h-6 bg-white/10 relative">
        <div 
          className="h-full bg-[#E1523D] transition-all duration-1000 ease-linear shadow-[0_0_30px_rgba(225,82,61,0.6)]"
          style={{ width: `${(timeLeft / exercise.duration) * 100}%` }}
        />
      </div>
    </div>
  );
};
