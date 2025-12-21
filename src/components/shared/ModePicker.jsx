import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const modes = [
  {
    id: 'real',
    title: 'Is This Real?',
    description: 'Detect AI-generated images, videos, and deepfakes',
    icon: Shield,
    color: 'slate',
    gradient: 'from-slate-50 to-slate-100',
    iconBg: 'from-slate-800 to-slate-900',
    path: createPageUrl('Home'),
    examples: ['Image verification', 'Deepfake detection', 'AI content check']
  },
  {
    id: 'true',
    title: 'Is This True?',
    description: 'Verify news, claims, and facts with citations',
    icon: CheckCircle,
    color: 'blue',
    gradient: 'from-blue-50 to-blue-100',
    iconBg: 'from-blue-600 to-blue-700',
    path: createPageUrl('True'),
    examples: ['Fact-check claims', 'Verify news', 'Check sources']
  },
  {
    id: 'scam',
    title: 'Is This a Scam?',
    description: 'Detect scams in messages, listings, and emails',
    icon: AlertTriangle,
    color: 'amber',
    gradient: 'from-amber-50 to-amber-100',
    iconBg: 'from-amber-600 to-amber-700',
    path: createPageUrl('Scam'),
    examples: ['Check messages', 'Verify listings', 'Email safety']
  },
  {
    id: 'safe',
    title: 'Is This Safe?',
    description: 'Get safety guidance for situations and decisions',
    icon: Heart,
    color: 'emerald',
    gradient: 'from-emerald-50 to-emerald-100',
    iconBg: 'from-emerald-600 to-emerald-700',
    path: createPageUrl('Safe'),
    examples: ['Safety checks', 'Risk assessment', 'Product safety']
  }
];

export default function ModePicker({ onSelectMode, currentMode }) {
  const handleModeClick = (mode) => {
    if (onSelectMode && mode.id === 'real') {
      onSelectMode('real');
    }
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Choose What You're Checking
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Select a verification mode to get started. Each tool is designed for specific types of analysis.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          const isRealMode = mode.id === 'real' && onSelectMode;
          
          const cardContent = (
            <div className={`bg-gradient-to-br ${mode.gradient} rounded-2xl p-8 border-2 border-${mode.color}-200 hover:border-${mode.color}-400 transition-all duration-300 cursor-pointer group h-full`}>
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <ChevronRight className={`w-6 h-6 text-${mode.color}-400 group-hover:translate-x-1 transition-transform`} />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {mode.title}
              </h3>
              <p className="text-slate-600 mb-4">
                {mode.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {mode.examples.map((example, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 bg-white/60 rounded-full text-slate-600"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          );
          
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {isRealMode ? (
                <button onClick={() => handleModeClick(mode)} className="w-full text-left">
                  {cardContent}
                </button>
              ) : (
                <Link to={mode.path}>
                  {cardContent}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}