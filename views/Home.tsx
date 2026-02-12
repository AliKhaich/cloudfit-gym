
import React, { useState, useEffect } from 'react';
import { PairingCard } from '../components/PairingCard';
import { SectionHeader } from '../components/SectionHeader';
import { WorkoutCard } from '../components/WorkoutCard';
import { CalendarStrip } from '../components/CalendarStrip';
import { FolderCard } from '../components/FolderCard';
import { TemplateCard } from '../components/TemplateCard';
import { storage } from '../services/storage';
import { Workout, Display, Folder } from '../types';
import { TEMPLATE_WORKOUTS } from '../constants';

interface HomeProps {
  onSelectWorkout: (workout: Workout) => void;
  onNavigate: (view: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectWorkout, onNavigate }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingCode, setPairingCode] = useState(['', '', '', '', '', '']);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setWorkouts(storage.getWorkouts());
    setFolders(storage.getFolders());
    setDisplays(storage.getDisplays());

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const handleCreateWorkout = () => {
    const newWorkout: Workout = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New Workout`,
      modules: [],
      lastModified: Date.now(),
      scheduledDays: []
    };
    onSelectWorkout(newWorkout);
  };

  const handleCloneTemplate = (template: Workout) => {
    const cloned: Workout = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      lastModified: Date.now(),
      name: `${template.name} (Copy)`
    };
    const updatedWorkouts = [...workouts, cloned];
    storage.setWorkouts(updatedWorkouts);
    setWorkouts(updatedWorkouts);
    onSelectWorkout(cloned);
  };

  const handlePair = (code: string) => {
    const newDisplay: Display = {
      id: code.toUpperCase(),
      name: `TV Display ${displays.length + 1}`,
      isActive: true,
      pairedAt: Date.now()
    };
    const updated = [...displays, newDisplay];
    storage.setDisplays(updated);
    setDisplays(updated);
    setShowPairingModal(false);
    setPairingCode(['', '', '', '', '', '']);
  };

  const handleRemoveDisplay = (id: string) => {
    const updated = displays.filter(d => d.id !== id);
    storage.setDisplays(updated);
    setDisplays(updated);
  };

  const handleCodeChange = (index: number, val: string) => {
    const v = val.toUpperCase();
    if (v.length > 1) return;
    const newCode = [...pairingCode];
    newCode[index] = v;
    setPairingCode(newCode);
    if (v && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const scheduledDaysList = Array.from(new Set(workouts.flatMap(w => w.scheduledDays)));
  const filteredBySchedule = workouts.filter(w => w.scheduledDays.includes(selectedDay));
  const filteredByFolder = activeFolderId 
    ? workouts.filter(w => folders.find(f => f.id === activeFolderId)?.workoutIds.includes(w.id))
    : workouts;

  return (
    <div className="animate-in fade-in duration-500">
      {deferredPrompt && (
        <div className="mx-4 mt-4 bg-[#E1523D] p-4 rounded-2xl flex items-center justify-between text-white shadow-lg animate-bounce">
          <div className="flex items-center gap-3">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             <span className="text-xs font-bold uppercase tracking-wider">Install for Gym Club</span>
          </div>
          <button onClick={handleInstall} className="bg-white text-[#E1523D] px-4 py-2 rounded-xl text-[10px] font-black uppercase">Install Now</button>
        </div>
      )}

      <div className="flex flex-col items-center pt-6 pb-2">
        <button 
          onClick={() => onNavigate('SETTINGS')}
          className="text-[11px] font-extrabold text-[#E1523D] tracking-widest uppercase flex items-center gap-2 hover:opacity-70"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
          Settings
        </button>
      </div>

      {displays.length === 0 ? (
        <PairingCard onPair={() => setShowPairingModal(true)} />
      ) : (
        <div className="mx-4 mt-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-gray-800">Paired Displays</h3>
             <button onClick={() => setShowPairingModal(true)} className="text-[#E1523D] text-xs font-bold">+ PAIR NEW</button>
           </div>
           <div className="flex gap-4 overflow-x-auto hide-scrollbar pt-2 pb-1">
             {displays.map(d => (
               <div key={d.id} className="relative min-w-[120px] bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     handleRemoveDisplay(d.id);
                   }}
                   className="absolute -top-1 -right-1 w-5 h-5 bg-white text-gray-400 hover:text-red-500 rounded-full border border-gray-200 flex items-center justify-center shadow-sm z-10 active:scale-90 transition-all"
                   title="Remove Display"
                 >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                 </button>
                 <div className="w-10 h-8 border-2 border-[#E1523D] rounded flex items-center justify-center mb-2">
                   <div className="w-4 h-1 bg-[#E1523D] rounded-full"></div>
                 </div>
                 <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center px-1">{d.name}</span>
                 <span className="text-[8px] text-gray-400 font-mono mt-1">ID: {d.id}</span>
               </div>
             ))}
           </div>
        </div>
      )}

      <SectionHeader 
        title={activeFolderId ? `Folder: ${folders.find(f => f.id === activeFolderId)?.name}` : "Recently Modified"} 
        actionText={activeFolderId ? "CLEAR FILTER" : "SEE ALL"}
        onAction={() => activeFolderId ? setActiveFolderId(null) : onNavigate('LIBRARY')} 
      />
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 hide-scrollbar">
        {filteredByFolder.length > 0 ? filteredByFolder.sort((a, b) => b.lastModified - a.lastModified).map(w => (
          <div key={w.id} onClick={() => onSelectWorkout(w)} className="cursor-pointer">
            <WorkoutCard workout={w} />
          </div>
        )) : (
          <div className="w-full text-center py-8 text-gray-400 text-sm">No workouts in this section.</div>
        )}
      </div>

      <SectionHeader title="Scheduled Workouts" actionText="MANAGE" onAction={() => onNavigate('SCHEDULE')} />
      <CalendarStrip selectedDay={selectedDay} onSelectDay={setSelectedDay} scheduledDays={scheduledDaysList} />
      
      <SectionHeader title="Your Folders" />
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 hide-scrollbar">
        {folders.map(folder => (
          <div key={folder.id} onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)} className="cursor-pointer">
            <FolderCard name={folder.name} active={activeFolderId === folder.id} />
          </div>
        ))}
      </div>

      <SectionHeader title="Examples & Templates" />
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 hide-scrollbar">
        {TEMPLATE_WORKOUTS.map(template => (
          <div key={template.id} onClick={() => handleCloneTemplate(template)} className="cursor-pointer">
            <TemplateCard label={template.name} />
          </div>
        ))}
      </div>

      <div className="fixed bottom-24 right-6 left-6 flex justify-center pointer-events-none md:justify-end">
        <button 
          onClick={handleCreateWorkout}
          className="pointer-events-auto bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 active:scale-95 transition-all hover:bg-black group"
        >
          <svg className="w-5 h-5 text-[#E1523D] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-bold uppercase tracking-widest text-sm">Create Workout</span>
        </button>
      </div>

      {showPairingModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative">
            <button onClick={() => setShowPairingModal(false)} className="absolute right-6 top-6 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold mb-4">Pair TV Display</h2>
            <p className="text-gray-500 mb-6">Enter the 6-character ID shown on your TV's "Display Ready" screen.</p>
            <div className="flex gap-2 mb-8">
              {pairingCode.map((char, i) => (
                <input 
                  key={i} 
                  id={`code-${i}`}
                  type="text" 
                  maxLength={1} 
                  value={char}
                  autoComplete="off"
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  className="w-full h-14 border-2 border-gray-100 rounded-xl text-center text-2xl font-bold focus:border-[#E1523D] outline-none transition-colors uppercase" 
                />
              ))}
            </div>
            <button 
              onClick={() => handlePair(pairingCode.join(''))}
              disabled={pairingCode.some(c => !c)}
              className="w-full py-4 bg-[#E1523D] text-white font-bold rounded-2xl uppercase tracking-widest shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
            >
              Link Device
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
