
import React from 'react';

interface TemplateCardProps {
  label: string;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ label }) => (
  <div className="min-w-[140px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-center text-center">
    <span className="text-xl font-medium text-gray-800">{label}</span>
  </div>
);
