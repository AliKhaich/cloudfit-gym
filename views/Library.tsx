
import React, { useState, useEffect } from 'react';
import { MOCK_EXERCISES } from '../constants';
import { Exercise } from '../types';
import { assetStorage } from '../services/assetStorage';
import { storage } from '../services/storage';

interface LibraryProps {
  onSelectExercise?: (exercise: Exercise) => void;
  onGenerateVideo?: (exercise: Exercise) => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelectExercise, onGenerateVideo }) => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [overrides, setOverrides] = useState<Record<string, Exercise>>({});
  const [localAssets, setLocalAssets] = useState<Record<string, { thumb?: string; video?: string }>>({});
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  
  // Custom Data States
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');

  useEffect(() => {
    const storedOverrides = JSON.parse(localStorage.getItem('cf_exercise_overrides') || '{}');
    setOverrides(storedOverrides);
    setCustomExercises(storage.getCustomExercises());
    setCustomCategories(storage.getCustomCategories());
    loadAllLocalAssets();
  }, []);

  const loadAllLocalAssets = async () => {
    const assets: Record<string, { thumb?: string; video?: string }> = {};
    const allExercises = [...MOCK_EXERCISES, ...storage.getCustomExercises()];
    for (const ex of allExercises) {
      const thumb = await assetStorage.getAsset(ex.id, 'thumbnail');
      const video = await assetStorage.getAsset(ex.id, 'video');
      if (thumb || video) {
        assets[ex.id] = { 
          thumb: thumb || undefined, 
          video: video || undefined 
        };
      }
    }
    setLocalAssets(assets);
  };

  const handleFileUpload = async (exerciseId: string, type: 'thumbnail' | 'video', file: File) => {
    await assetStorage.saveAsset(exerciseId, type, file);
    const url = URL.createObjectURL(file);
    setLocalAssets(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [type === 'thumbnail' ? 'thumb' : 'video']: url }
    }));
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const updated = Array.from(new Set([...customCategories, newCatName.trim()]));
    storage.setCustomCategories(updated);
    setCustomCategories(updated);
    setNewCatName('');
    setIsAddingCategory(false);
    setActiveCat(newCatName.trim());
  };

  const handleAddExercise = () => {
    if (!newExName.trim()) return;
    const category = activeCat === 'All' ? 'General' : activeCat;
    const newEx: Exercise = {
      id: `custom_${Date.now()}`,
      name: newExName.trim(),
      category: category,
      duration: 60,
      thumbnail: 'https://picsum.photos/seed/new/400/225',
    };
    const updated = [...customExercises, newEx];
    storage.setCustomExercises(updated);
    setCustomExercises(updated);
    setNewExName('');
    setIsAddingExercise(false);
    // Automatically open media editor for the new exercise
    setEditingMediaId(newEx.id);
  };

  const defaultCategories = ['All', 'Cardio', 'Strength', 'Core', 'Legs', 'HIIT'];
  const allCategories = Array.from(new Set([...defaultCategories, ...customCategories]));
  const allExercises = [...MOCK_EXERCISES, ...customExercises].map(ex => overrides[ex.id] || ex);

  const filtered = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCat === 'All' || ex.category === activeCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Search library..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E1523D]/10 focus:border-[#E1523D] shadow-sm font-medium transition-all"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* Categories Bar with Add Button */}
      <div className="flex items-center gap-2 mb-8 -mx-4 px-4 overflow-hidden">
        <button 
          onClick={() => setIsAddingCategory(true)}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-[#E1523D] text-white shadow-lg shadow-orange-200 active:scale-90 transition-all"
          title="Add Category"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
          {allCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest border-2 whitespace-nowrap transition-all active:scale-90
                ${activeCat === cat 
                  ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-lg' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add Category Modal/Inline */}
      {isAddingCategory && (
        <div className="mb-6 animate-in slide-in-from-top duration-300 bg-[#1A1A1A] p-6 rounded-[24px] shadow-xl">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#E1523D] mb-4">New Category</h4>
          <div className="flex gap-2">
            <input 
              autoFocus
              type="text" 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.target.value..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#E1523D] transition-colors"
            />
            <button 
              onClick={handleAddCategory}
              className="px-6 bg-[#E1523D] text-white font-black uppercase tracking-widest text-[10px] rounded-xl active:scale-95 transition-all"
            >
              Add
            </button>
            <button 
              onClick={() => setIsAddingCategory(false)}
              className="p-3 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Add Exercise Trigger Card */}
        <div 
          onClick={() => setIsAddingExercise(true)}
          className={`bg-white border-2 border-dashed border-gray-200 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#E1523D] hover:bg-orange-50/30 transition-all group active:scale-[0.98] ${isAddingExercise ? 'hidden' : 'block'}`}
        >
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#E1523D] group-hover:text-white transition-all shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#E1523D]">
            Add {activeCat === 'All' ? 'Exercise' : `${activeCat} Exercise`}
          </p>
        </div>

        {/* Add Exercise Input Card */}
        {isAddingExercise && (
          <div className="bg-[#1A1A1A] rounded-[32px] p-6 animate-in zoom-in duration-300 border border-white/5 shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#E1523D] mb-4">New {activeCat} Exercise</h4>
            <div className="flex flex-col gap-4">
              <input 
                autoFocus
                type="text" 
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Exercise Name..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold outline-none focus:border-[#E1523D] transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleAddExercise}
                  className="flex-1 py-4 bg-[#E1523D] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                >
                  Create Exercise
                </button>
                <button 
                  onClick={() => setIsAddingExercise(false)}
                  className="px-6 py-4 bg-white/5 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {filtered.map(ex => {
          const hasLocalThumb = localAssets[ex.id]?.thumb;
          const hasLocalVideo = localAssets[ex.id]?.video;
          
          return (
            <div key={ex.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 flex flex-col group relative animate-in fade-in duration-500">
              <div className="flex items-center p-2">
                <div className="relative cursor-pointer group/img shrink-0" onClick={() => onSelectExercise?.(ex)}>
                  <img 
                    src={hasLocalThumb || ex.thumbnail} 
                    className="w-24 h-24 object-cover rounded-[24px] border border-gray-50 bg-gray-50" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400/225';
                    }}
                    alt={ex.name} 
                  />
                  {hasLocalThumb && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full shadow-lg">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 min-w-0" onClick={() => onSelectExercise?.(ex)}>
                  <span className="text-[9px] font-black text-[#E1523D] uppercase tracking-widest mb-0.5 block">{ex.category}</span>
                  <h4 className="text-base font-extrabold text-gray-900 group-hover:text-[#E1523D] transition-colors truncate">{ex.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hasLocalVideo || ex.videoUrl ? (
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                        {hasLocalVideo ? 'Live Media' : 'Project Asset'}
                      </span>
                    ) : (
                      <span className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">No Video</span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setEditingMediaId(editingMediaId === ex.id ? null : ex.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all mr-2
                    ${editingMediaId === ex.id ? 'bg-[#1A1A1A] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                </button>
              </div>

              {editingMediaId === ex.id && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Manage Exercise Media</h5>
                  <p className="text-[9px] text-gray-400 mb-4 italic">Overrides current project assets for this session.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#E1523D] hover:bg-white transition-all">
                      <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[9px] font-black uppercase text-gray-400 text-center leading-tight">Thumbnail (PNG/JPG)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(ex.id, 'thumbnail', e.target.files[0])} />
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#E1523D] hover:bg-white transition-all">
                      <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <span className="text-[9px] font-black uppercase text-gray-400 text-center leading-tight">Demo Video (MP4)</span>
                      <input type="file" accept="video/mp4" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(ex.id, 'video', e.target.files[0])} />
                    </label>
                  </div>
                  {(hasLocalVideo || ex.videoUrl) && (
                    <div className="mt-4 aspect-video bg-black rounded-xl overflow-hidden relative border border-white/5">
                       <video key={hasLocalVideo || ex.videoUrl} src={hasLocalVideo || ex.videoUrl} autoPlay loop muted className="w-full h-full object-cover opacity-60" />
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white shadow-xl">Media Preview</span>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-24" />
    </div>
  );
};
