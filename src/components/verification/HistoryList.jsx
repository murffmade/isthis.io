import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Image, Video, Link2, CheckCircle2, AlertTriangle, HelpCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const resultIcons = {
  likely_real: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  likely_ai: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  uncertain: { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-100' }
};

const typeIcons = {
  image: Image,
  video: Video,
  url: Link2
};

export default function HistoryList({ records, onSelectRecord, onDeleteRecord }) {
  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Image className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-500">No analysis history yet</p>
        <p className="text-sm text-slate-400 mt-1">Your checks will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record, index) => {
        const resultConfig = resultIcons[record.result] || resultIcons.uncertain;
        const ResultIcon = resultConfig.icon;
        const TypeIcon = typeIcons[record.content_type] || Image;

        return (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectRecord(record)}
            className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-4">
              {/* Thumbnail or Icon */}
              <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {record.thumbnail_url ? (
                  <img 
                    src={record.thumbnail_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TypeIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-md ${resultConfig.bg} flex items-center justify-center`}>
                    <ResultIcon className={`w-3.5 h-3.5 ${resultConfig.color}`} />
                  </div>
                  <span className="font-medium text-slate-700 text-sm">
                    {record.result === 'likely_real' ? 'Likely Real' :
                     record.result === 'likely_ai' ? 'Likely AI' : 'Uncertain'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {record.confidence}% confidence
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {record.source_url || record.content_type.charAt(0).toUpperCase() + record.content_type.slice(1) + ' upload'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(record.created_date), 'MMM d, yyyy · h:mm a')}
                </p>
              </div>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRecord(record.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}