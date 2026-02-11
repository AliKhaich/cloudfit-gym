
import { Workout, Display, Folder } from '../types';

const KEYS = {
  WORKOUTS: 'cf_workouts',
  DISPLAYS: 'cf_displays',
  FOLDERS: 'cf_folders',
};

export const storage = {
  getWorkouts: (): Workout[] => JSON.parse(localStorage.getItem(KEYS.WORKOUTS) || '[]'),
  setWorkouts: (workouts: Workout[]) => localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts)),
  
  getDisplays: (): Display[] => JSON.parse(localStorage.getItem(KEYS.DISPLAYS) || '[]'),
  setDisplays: (displays: Display[]) => localStorage.setItem(KEYS.DISPLAYS, JSON.stringify(displays)),
  
  getFolders: (): Folder[] => JSON.parse(localStorage.getItem(KEYS.FOLDERS) || '[]'),
  setFolders: (folders: Folder[]) => localStorage.setItem(KEYS.FOLDERS, JSON.stringify(folders)),
};
