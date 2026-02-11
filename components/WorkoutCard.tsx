
import React from 'react';
import { Workout } from '../types';
import { MOCK_EXERCISES } from '../constants';

interface WorkoutCardProps {
  workout: Workout;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout }) => {
  const calculateTotalTime = () => {
    const totalSeconds = workout.modules.reduce((acc, m) => {
      const exercise = MOCK_EXERCISES.find(ex => ex.id === m.exerciseId);
      return acc + (m.duration ?? exercise?.duration ?? 0);
    }, 0);
    
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  };

  return (
    <div className="min-w-[280px] bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between relative h-32">
      <div>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          {workout.modules.length} {workout.modules.length === 1 ? 'module' : 'modules'}, {calculateTotalTime()}
        </p>
        <h4 className="text-xl font-semibold text-gray-900 mt-1">{workout.name}</h4>
      </div>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors">
        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    </div>
  );
};
