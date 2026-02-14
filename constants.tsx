
import React from 'react';
import { Exercise, Workout } from './types';

export const COLORS = {
  primary: '#E1523D', // CloudFit Orange
  dark: '#1A1A1A',
  bg: '#F5F5F5',
  card: '#FFFFFF',
};

/**
 * PATH GUIDANCE:
 * Create an 'assets' folder in your project root.
 * Place your images and videos there and name them accordingly.
 */
export const MOCK_EXERCISES: Exercise[] = [
  { 
    id: '1', 
    name: 'Jumping Jacks', 
    category: 'Cardio', 
    duration: 60, 
    thumbnail: './assets/jacks_thumb.png',
    videoUrl: './assets/jacks_video.mp4' 
  },
  { 
    id: '2', 
    name: 'Push Ups', 
    category: 'Strength', 
    duration: 45, 
    thumbnail: './assets/pushups_thumb.png',
    videoUrl: './assets/pushups_video.mp4'
  },
  { 
    id: '3', 
    name: 'Plank', 
    category: 'Core', 
    duration: 30, 
    thumbnail: './assets/plank_thumb.png',
    videoUrl: './assets/plank_video.mp4'
  },
  { 
    id: '4', 
    name: 'Squats', 
    category: 'Legs', 
    duration: 60, 
    thumbnail: './assets/squats_thumb.png',
    videoUrl: './assets/squats_video.mp4'
  },
  { 
    id: '5', 
    name: 'Burpees', 
    category: 'HIIT', 
    duration: 45, 
    thumbnail: './assets/burpees_thumb.png',
    videoUrl: './assets/burpees_video.mp4'
  },
  { 
    id: '6', 
    name: 'Bicep Curls', 
    category: 'Strength', 
    duration: 50, 
    thumbnail: './assets/curls_thumb.png',
    videoUrl: './assets/curls_video.mp4'
  },
];

export const TEMPLATE_WORKOUTS: Workout[] = [
  {
    id: 't1',
    name: 'Morning Energy',
    modules: [
      { id: 'm1', exerciseId: '1', displayId: 'local', duration: 60 },
      { id: 'm2', exerciseId: '4', displayId: 'local', duration: 60 },
      { id: 'm3', exerciseId: '5', displayId: 'local', duration: 30 }
    ],
    lastModified: Date.now(),
    scheduledDays: [1, 3, 5]
  },
  {
    id: 't2',
    name: 'Core Crusher',
    modules: [
      { id: 'm4', exerciseId: '3', displayId: 'local', duration: 60 },
      { id: 'm5', exerciseId: '3', displayId: 'local', duration: 60 }
    ],
    lastModified: Date.now(),
    scheduledDays: [2, 4]
  },
  {
    id: 't3',
    name: 'Quick Strength',
    modules: [
      { id: 'm6', exerciseId: '2', displayId: 'local', duration: 45 },
      { id: 'm7', exerciseId: '6', displayId: 'local', duration: 45 }
    ],
    lastModified: Date.now(),
    scheduledDays: [0, 6]
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
