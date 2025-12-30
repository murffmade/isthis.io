import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { copy } from '@/components/content/copy';

export default function DisclaimerBanner({ variant = 'default' }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border-2 ${
      variant === 'prominent' 
        ? 'bg-amber-50 border-amber-300' 
        : 'bg-slate-50 border-slate-200'
    } p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          variant === 'prominent' ? 'text-amber-600' : 'text-slate-500'
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm sm:text-base font-medium ${
            variant === 'prominent' ? 'text-amber-900' : 'text-slate-700'
          }`}>
            {copy.disclaimerResults}
          </p>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className={`text-xs sm:text-sm mt-2 ${
                  variant === 'prominent' ? 'text-amber-800' : 'text-slate-600'
                }`}>
                  {copy.disclaimerExpanded}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className={`mt-2 text-xs sm:text-sm font-medium inline-flex items-center gap-1 ${
              variant === 'prominent' 
                ? 'text-amber-700 hover:text-amber-900' 
                : 'text-slate-600 hover:text-slate-900'
            } transition-colors`}
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Learn more <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}