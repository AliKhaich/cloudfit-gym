
import { Workout, Display, Folder, Exercise } from '../types';

const KEYS = {
  WORKOUTS: 'cf_workouts',
  DISPLAYS: 'cf_displays',
  FOLDERS: 'cf_folders',
  CUSTOM_EXERCISES: 'cf_custom_exercises',
  CUSTOM_CATEGORIES: 'cf_custom_categories',
};

export const storage = {
  getWorkouts: (): Workout[] => JSON.parse(localStorage.getItem(KEYS.WORKOUTS) || '[]'),
  setWorkouts: (workouts: Workout[]) => localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts)),
  
  getDisplays: (): Display[] => JSON.parse(localStorage.getItem(KEYS.DISPLAYS) || '[]'),
  setDisplays: (displays: Display[]) => localStorage.setItem(KEYS.DISPLAYS, JSON.stringify(displays)),
  
  getFolders: (): Folder[] => JSON.parse(localStorage.getItem(KEYS.FOLDERS) || '[]'),
  setFolders: (folders: Folder[]) => localStorage.setItem(KEYS.FOLDERS, JSON.stringify(folders)),

  getCustomExercises: (): Exercise[] => JSON.parse(localStorage.getItem(KEYS.CUSTOM_EXERCISES) || '[]'),
  setCustomExercises: (exercises: Exercise[]) => localStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(exercises)),

  getCustomCategories: (): string[] => JSON.parse(localStorage.getItem(KEYS.CUSTOM_CATEGORIES) || '[]'),
  setCustomCategories: (categories: string[]) => localStorage.setItem(KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories)),
};
