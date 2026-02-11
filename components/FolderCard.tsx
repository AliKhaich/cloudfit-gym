
import React from 'react';

interface FolderCardProps {
  name: string;
  active?: boolean;
}

export const FolderCard: React.FC<FolderCardProps> = ({ name, active }) => (
  <div className={`min-w-[160px] rounded-2xl p-4 shadow-sm border flex items-center gap-3 transition-all
    ${active ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
    <div className={`p-2 rounded-lg ${active ? 'bg-white/10' : 'bg-gray-100'}`}>
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    </div>
    <span className="font-semibold">{name}</span>
  </div>
);
