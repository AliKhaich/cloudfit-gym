
import React from 'react';

interface CalendarStripProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  scheduledDays: number[]; // Days that have workouts
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({ selectedDay, onSelectDay, scheduledDays }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white mx-4 mt-2 p-4 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto hide-scrollbar">
      <div className="flex justify-between items-center min-w-[320px]">
        {days.map((day, i) => {
          const hasWorkouts = scheduledDays.includes(i);
          const isSelected = selectedDay === i;
          
          return (
            <div key={day} className="flex flex-col items-center gap-2">
              <span className={`text-[10px] font-medium uppercase tracking-widest transition-colors ${isSelected ? 'text-[#E1523D]' : 'text-gray-400'}`}>
                {day}
              </span>
              <div 
                onClick={() => onSelectDay(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all relative cursor-pointer
                  ${isSelected ? 'bg-[#E1523D] text-white shadow-lg scale-110' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                {/* Simplified date indicator, just showing day of week index for UX */}
                {i + 1}
                {hasWorkouts && !isSelected && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-[#E1523D] rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
