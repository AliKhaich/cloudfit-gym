
import React from 'react';
import { Workout } from '../types';
import { MOCK_EXERCISES } from '../constants';

interface WorkoutCardProps {
  workout: Workout;
  onSelect?: (workout: Workout) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onSelect, onDelete }) => {
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
    <div className="relative min-w-[280px] h-32 group">
      {/* Main Clickable Area - Card Content */}
      <div 
        onClick={() => onSelect?.(workout)}
        className="absolute inset-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-[#E1523D]/20 transition-all cursor-pointer active:scale-[0.98] z-10"
      >
        <div>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            {workout.modules.length} {workout.modules.length === 1 ? 'module' : 'modules'}, {calculateTotalTime()}
          </p>
          <h4 className="text-xl font-semibold text-gray-900 mt-1 truncate pr-8">{workout.name}</h4>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {workout.modules.slice(0, 3).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                 <img src={MOCK_EXERCISES.find(ex => ex.id === m.exerciseId)?.thumbnail} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
            {workout.modules.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-black text-gray-500">
                +{workout.modules.length - 3}
              </div>
            )}
          </div>
          
          <div className="p-2 text-gray-300 group-hover:text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Modern Minimalistic Delete Button - High Z-Index for Phone reliability */}
      {onDelete && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(workout.id, e);
          }}
          className="absolute -top-1 -right-1 w-9 h-9 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-center z-[60] hover:bg-red-50 hover:border-red-100 hover:text-red-500 text-gray-400 transition-all active:scale-90"
          title="Delete Workout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      )}
    </div>
  );
};
