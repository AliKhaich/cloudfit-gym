
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { Library } from './views/Library';
import { WorkoutEditor } from './views/WorkoutEditor';
import { Player } from './views/Player';
import { Prepare } from './views/Prepare';
import { TVView } from './views/TVView';
import { ViewType, Workout, Exercise } from './types';
import { storage } from './services/storage';
import { generateExerciseVideo } from './services/ai';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('HOME');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [preparingWorkout, setPreparingWorkout] = useState<Workout | null>(null);
  const [playingWorkout, setPlayingWorkout] = useState<Workout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  // Check if we are in TV mode via URL parameter ?role=tv
  const isTVMode = new URLSearchParams(window.location.search).get('role') === 'tv';

  // Key Selection logic for Veo
  const ensureApiKey = async (): Promise<boolean> => {
    // @ts-ignore
    if (await window.aistudio.hasSelectedApiKey()) {
      return true;
    }
    // @ts-ignore
    await window.aistudio.openSelectKey();
    return true;
  };

  const handleGenerateVideo = async (exercise: Exercise) => {
    try {
      await ensureApiKey();
      setIsGenerating(true);
      const videoUrl = await generateExerciseVideo(exercise.name, setGenStatus);
      
      const overrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
      overrides[exercise.id] = { ...exercise, videoUrl };
      localStorage.setItem('cf_exercise_overrides', JSON.stringify(overrides));
      
      alert("AI Video generated successfully!");
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      } else {
        alert("Failed to generate video. Please ensure you have a valid paid API key selected.");
      }
    } finally {
      setIsGenerating(false);
      setGenStatus('');
    }
  };

  const handleUpdateWorkout = (workout: Workout) => {
    const workouts = storage.getWorkouts();
    const index = workouts.findIndex(w => w.id === workout.id);
    let updated;
    if (index >= 0) {
      updated = [...workouts];
      updated[index] = { ...workout, lastModified: Date.now() };
    } else {
      updated = [...workouts, { ...workout, lastModified: Date.now() }];
    }
    storage.setWorkouts(updated);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setActiveView('EDITOR');
  };

  const handlePrepareWorkout = (workout: Workout) => {
    setPreparingWorkout(workout);
    setActiveView('PREPARE');
  };

  const handlePlayWorkout = (workout: Workout) => {
    setPlayingWorkout(workout);
    setActiveView('PLAYER');
  };

  if (isTVMode) {
    return <TVView />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'HOME':
        return <Home onSelectWorkout={handlePrepareWorkout} onNavigate={setActiveView} />;
      case 'LIBRARY':
        return <Library onSelectExercise={(ex) => console.log('Ex detail', ex)} onGenerateVideo={handleGenerateVideo} />;
      case 'EDITOR':
        return editingWorkout ? (
          <WorkoutEditor 
            workout={editingWorkout} 
            onSave={(w) => { handleUpdateWorkout(w); setEditingWorkout(null); setActiveView('HOME'); }} 
            onCancel={() => { setEditingWorkout(null); setActiveView('HOME'); }} 
            onPlay={handlePlayWorkout}
          />
        ) : <Home onSelectWorkout={handlePrepareWorkout} onNavigate={setActiveView} />;
      case 'PREPARE':
        return preparingWorkout ? (
          <Prepare 
            workout={preparingWorkout} 
            onStart={(w) => { handleUpdateWorkout(w); handlePlayWorkout(w); }}
            onEdit={(w) => { handleUpdateWorkout(w); handleEditWorkout(w); }}
            onClose={() => setActiveView('HOME')}
          />
        ) : <Home onSelectWorkout={handlePrepareWorkout} onNavigate={setActiveView} />;
      case 'PLAYER':
        return playingWorkout ? (
          <Player workout={playingWorkout} onClose={() => setActiveView('HOME')} />
        ) : <Home onSelectWorkout={handlePrepareWorkout} onNavigate={setActiveView} />;
      case 'SCHEDULE':
        return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">Schedule Coming Soon</div>;
      case 'SETTINGS':
        return (
          <div className="p-8 flex flex-col items-center gap-6">
            <h2 className="text-xl font-bold uppercase tracking-widest">Settings</h2>
            
            <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-[#E1523D] tracking-widest">API Configuration</h3>
              <button 
                onClick={() => {
                  // @ts-ignore
                  window.aistudio.openSelectKey();
                }}
                className="w-full px-6 py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
              >
                Select Google API Key
              </button>
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Required for Veo Video generation. 
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[#E1523D] ml-1">Learn about billing</a>
              </p>
            </div>

            <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-[#E1523D] tracking-widest">TV Display</h3>
              <p className="text-xs text-gray-500">Open this link on your TV to use it as a workout display.</p>
              <div className="bg-gray-50 p-3 rounded-xl break-all text-[10px] font-mono text-gray-400 border border-gray-100">
                {window.location.origin}{window.location.pathname}?role=tv
              </div>
              <button 
                onClick={() => window.open(`${window.location.origin}${window.location.pathname}?role=tv`, '_blank')}
                className="w-full py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-2xl font-bold uppercase tracking-widest text-xs"
              >
                Launch TV Preview
              </button>
            </div>
          </div>
        );
      default:
        return <Home onSelectWorkout={handlePrepareWorkout} onNavigate={setActiveView} />;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
      
      {isGenerating && (
        <div className="fixed inset-0 bg-[#1A1A1A]/95 z-[300] flex flex-col items-center justify-center p-8 text-center text-white backdrop-blur-sm animate-in fade-in duration-300">
           <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-[#E1523D]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#E1523D] rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <svg className="w-10 h-10 text-[#E1523D]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
              </div>
           </div>
           <h2 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">AI Video Magic</h2>
           <p className="text-gray-400 font-medium max-w-xs leading-relaxed">{genStatus}</p>
        </div>
      )}
    </Layout>
  );
};

export default App;
