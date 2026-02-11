
import React from 'react';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionText = "SEE ALL", onAction }) => (
  <div className="flex justify-between items-center px-4 mt-6 mb-2">
    <h3 className="text-[11px] font-extrabold text-[#1A1A1A]/80 tracking-widest uppercase">{title}</h3>
    <button onClick={onAction} className="text-[11px] font-extrabold text-[#1A1A1A]/50 tracking-widest uppercase hover:text-[#E1523D] transition-colors">
      {actionText}
    </button>
  </div>
);
