import React from 'react';
import { Tag } from 'lucide-react';

export default function VersionTag({ engineVersion, scoringVersion }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs">
      <Tag className="w-3 h-3 text-slate-500" />
      <span className="text-slate-600">
        Engine: <span className="font-mono font-semibold text-slate-900">{engineVersion}</span>
      </span>
      <span className="text-slate-400">•</span>
      <span className="text-slate-600">
        Scoring: <span className="font-mono font-semibold text-slate-900">{scoringVersion}</span>
      </span>
    </div>
  );
}