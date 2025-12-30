import React from 'react';

export default function LikelihoodRangeBar({ min, max, metaConfidence }) {
  const midpoint = (min + max) / 2;
  const range = max - min;

  const getRangeColor = () => {
    if (midpoint < 35) return 'bg-emerald-500';
    if (midpoint < 65) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getConfidenceOpacity = () => {
    switch (metaConfidence) {
      case 'LOW': return 'opacity-40';
      case 'MEDIUM': return 'opacity-70';
      case 'HIGH': return 'opacity-100';
      default: return 'opacity-70';
    }
  };

  return (
    <div className="w-full">
      <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200"></div>
        
        {/* Range indicator */}
        <div
          className={`absolute h-full ${getRangeColor()} ${getConfidenceOpacity()} transition-all duration-500`}
          style={{
            left: `${min}%`,
            width: `${range}%`
          }}
        >
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        </div>

        {/* Midpoint marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-slate-900"
          style={{ left: `${midpoint}%` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-white"></div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-900 whitespace-nowrap">
            {midpoint.toFixed(0)}%
          </div>
        </div>

        {/* Range labels */}
        <div className="absolute -bottom-8 left-0 text-xs text-slate-600">
          {min}%
        </div>
        <div className="absolute -bottom-8 right-0 text-xs text-slate-600">
          {max}%
        </div>
      </div>

      <div className="flex items-center justify-between mt-10 text-xs text-slate-500">
        <span>More Human-Like</span>
        <span>More AI-Like</span>
      </div>
    </div>
  );
}