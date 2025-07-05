import React from 'react';

interface StravaSyncButtonProps {
  onSync: () => void;
}

export default function StravaSyncButton({ onSync }: StravaSyncButtonProps) {
  return (
    <button
      title="Sync with Strava"
      onClick={onSync}
      className="inline-flex items-center gap-2 bg-[#FC4C02] hover:bg-[#E8440B] text-white rounded-md px-3 py-2 text-sm font-medium transition-colors shadow-sm"
    >
      {/* Strava Logo SVG */}
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className="flex-shrink-0"
      >
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.917"/>
      </svg>
      
    
      <span className="text-xs opacity-90">Sync</span>
    </button>
  );
}

// Updated header layout for TrainingDashboard.tsx:
export function HeaderWithSync({ onSync }: { onSync: () => void }) {
  return (
    <div className="py-3 px-6">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Left spacer to balance the layout */}
        <div className="w-24"></div>
        
        {/* Centered JRNY logo */}
        <h1 className="text-xl font-black text-center text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6" 
            style={{fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.05em'}}>
          JRNY
        </h1>
        
        {/* Right-aligned Strava sync button */}
        <div className="w-24 flex justify-end">
          <StravaSyncButton onSync={onSync} />
        </div>
      </div>
    </div>
  );
}