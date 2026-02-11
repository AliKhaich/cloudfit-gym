
export interface Display {
  id: string;
  name: string;
  isActive: boolean;
  pairedAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: number; // in seconds
  thumbnail: string;
  videoUrl?: string;
}

export interface WorkoutModule {
  id: string;
  exerciseId: string;
  displayId: string; // The display this exercise should play on. 'local' means this device.
  duration?: number; // Custom duration override for this specific instance in the workout
}

export interface Workout {
  id: string;
  name: string;
  modules: WorkoutModule[];
  lastModified: number;
  scheduledDays: number[]; // 0-6 for Sun-Sat
}

export interface Folder {
  id: string;
  name: string;
  workoutIds: string[];
}

export type ViewType = 'HOME' | 'LIBRARY' | 'SCHEDULE' | 'SETTINGS' | 'EDITOR' | 'PLAYER' | 'PREPARE';

export const LOCAL_DISPLAY_ID = 'local';
