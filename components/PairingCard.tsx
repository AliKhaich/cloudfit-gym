
import React from 'react';

interface PairingCardProps {
  onPair: () => void;
}

export const PairingCard: React.FC<PairingCardProps> = ({ onPair }) => {
  return (
    <div className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <h2 className="text-xl font-bold text-black mb-6">Pair your first workout display!</h2>
      
      <div className="flex gap-4 mb-6">
        {/* Mock Devices Icons */}
        <div className="w-12 h-10 border-2 border-gray-300 rounded flex items-center justify-center opacity-60">
            <div className="text-[10px] font-bold">TV</div>
        </div>
        <div className="w-10 h-14 border-2 border-gray-300 rounded flex items-center justify-center opacity-60">
            <div className="text-[10px] font-bold">TAB</div>
        </div>
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center opacity-60">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-8 max-w-[280px]">
        Install the CloudFit TV app on an Apple TV, iPad or compatible Android TV device and press here to pair.
      </p>
      
      <div className="flex gap-3 w-full max-w-[300px]">
        <button 
          onClick={onPair}
          className="flex-1 py-3 bg-black text-white border-2 border-black rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
        >
          Pair
        </button>
        <button className="flex-1 py-3 bg-black text-white border-2 border-black rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95">
          Help
        </button>
      </div>
      
      <button className="mt-4 px-6 py-3 bg-black text-white border-2 border-black rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all w-full max-w-[300px] active:scale-95">
        Compatible Devices
      </button>
    </div>
  );
};
