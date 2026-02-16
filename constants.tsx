
import React from 'react';
import { Exercise, Workout } from './types';

export const COLORS = {
  primary: '#E1523D',
  dark: '#1A1A1A',
  bg: '#F5F5F5',
  card: '#FFFFFF',
};

const CARDIO: Exercise[] = [
  { 
    id: 'ex-jacks', 
    name: 'Jumping Jacks', 
    category: 'Cardio', 
    duration: 60, 
    thumbnail: 'https://picsum.photos/seed/jacks/400/225',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
  },
  { 
    id: 'ex-burpees', 
    name: 'Burpees', 
    category: 'Cardio', 
    duration: 45, 
    thumbnail: 'https://picsum.photos/seed/burpees/400/225',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
];

const STRENGTH: Exercise[] = [
  { 
    id: 'ex-pushups', 
    name: 'Push Ups', 
    category: 'Strength', 
    duration: 45, 
    thumbnail: 'https://picsum.photos/seed/pushups/400/225',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  { 
    id: 'ex-curls', 
    name: 'Bicep Curls', 
    category: 'Strength', 
    duration: 50, 
    thumbnail: 'https://picsum.photos/seed/curls/400/225',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  },
];

const CORE: Exercise[] = [
  { 
    id: 'ex-plank', 
    name: 'Plank', 
    category: 'Core', 
    duration: 30, 
    thumbnail: 'https://picsum.photos/seed/plank/400/225',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  },
];

const LEGS: Exercise[] = [
  { 
    id: 'ex-squats', 
    name: 'Squats', 
    category: 'Legs', 
    duration: 60, 
    thumbnail: 'https://picsum.photos/seed/squats/400/225',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
];

export const STATIC_EXERCISES: Exercise[] = [
  ...CARDIO,
  ...STRENGTH,
  ...CORE,
  ...LEGS,
];

export const TEMPLATE_WORKOUTS: Workout[] = [
  {
    id: 't1',
    name: 'Full Body Station Circuit',
    modules: [
      { id: 'm1', exerciseId: 'ex-jacks', displayId: 'local', duration: 30 },
      { id: 'm2', exerciseId: 'ex-pushups', displayId: 'STATION 1', duration: 30 },
      { id: 'm3', exerciseId: 'ex-squats', displayId: 'STATION 2', duration: 30 },
      { id: 'm4', exerciseId: 'ex-plank', displayId: 'STATION 3', duration: 30 }
    ],
    lastModified: Date.now(),
    scheduledDays: [1, 3, 5]
  }
];

export const Logo = () => (
  <div className="flex items-center gap-1">
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 15L20 25L30 15" stroke="#E1523D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 25L20 15L30 25" stroke="#E1523D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
    <div className="flex flex-col leading-tight">
      <span className="font-black text-white tracking-tighter text-xl italic uppercase">Cloud</span>
      <span className="font-bold text-[#E1523D] tracking-widest text-xs uppercase -mt-1">Fit</span>
    </div>
  </div>
);
