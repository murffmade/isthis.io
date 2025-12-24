import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TIER_CONFIG = {
  bronze: { 
    name: 'Bronze', 
    color: 'from-amber-600 to-amber-800', 
    commission: 30, 
    requirement: 0,
    icon: '🥉'
  },
  silver: { 
    name: 'Silver', 
    color: 'from-slate-400 to-slate-600', 
    commission: 35, 
    requirement: 10,
    icon: '🥈'
  },
  gold: { 
    name: 'Gold', 
    color: 'from-yellow-400 to-yellow-600', 
    commission: 40, 
    requirement: 25,
    icon: '🥇'
  },
  platinum: { 
    name: 'Platinum', 
    color: 'from-cyan-400 to-blue-600', 
    commission: 45, 
    requirement: 50,
    icon: '💎'
  },
  diamond: { 
    name: 'Diamond', 
    color: 'from-purple-500 to-pink-600', 
    commission: 50, 
    requirement: 100,
    icon: '👑'
  }
};

export default function TierProgress({ influencer }) {
  const currentTier = TIER_CONFIG[influencer.current_tier] || TIER_CONFIG.bronze;
  const tierKeys = Object.keys(TIER_CONFIG);
  const currentIndex = tierKeys.indexOf(influencer.current_tier);
  const nextTierKey = tierKeys[currentIndex + 1];
  const nextTier = nextTierKey ? TIER_CONFIG[nextTierKey] : null;

  const conversionsToNext = nextTier ? nextTier.requirement - influencer.total_conversions : 0;
  const progress = nextTier 
    ? ((influencer.total_conversions - currentTier.requirement) / (nextTier.requirement - currentTier.requirement)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your Tier</h3>
          <p className="text-sm text-slate-600">Unlock higher commissions</p>
        </div>
        <Award className="w-6 h-6 text-indigo-600" />
      </div>

      {/* Current Tier Badge */}
      <div className={`bg-gradient-to-r ${currentTier.color} rounded-xl p-6 text-white mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentTier.icon}</span>
            <div>
              <div className="text-2xl font-bold">{currentTier.name}</div>
              <div className="text-sm opacity-90">Current Tier</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentTier.commission}%</div>
            <div className="text-sm opacity-90">Commission</div>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-700">
              Progress to {nextTier.name}
            </div>
            <div className="text-sm text-slate-600">
              {conversionsToNext} more conversion{conversionsToNext !== 1 ? 's' : ''} needed
            </div>
          </div>
          
          <Progress value={Math.min(100, Math.max(0, progress))} className="mb-2" />
          
          <div className="text-xs text-slate-500 mb-4">
            {influencer.total_conversions} / {nextTier.requirement} conversions
          </div>

          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900 mb-1">
                  Unlock {nextTier.commission}% commission at {nextTier.name}!
                </div>
                <div className="text-sm text-slate-600">
                  Get {conversionsToNext} more conversion{conversionsToNext !== 1 ? 's' : ''} to upgrade and earn more on every sale.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!nextTier && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-600" />
            <div>
              <div className="font-bold text-purple-900">🎉 Maximum Tier Reached!</div>
              <div className="text-sm text-purple-700">You're earning the highest commission rate possible.</div>
            </div>
          </div>
        </div>
      )}

      {/* All Tiers */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">All Tiers</h4>
        <div className="space-y-2">
          {tierKeys.map((key, idx) => {
            const tier = TIER_CONFIG[key];
            const isUnlocked = influencer.total_conversions >= tier.requirement;
            const isCurrent = key === influencer.current_tier;
            
            return (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isCurrent
                    ? 'bg-indigo-50 border-indigo-200'
                    : isUnlocked
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <div className={`font-semibold ${isCurrent ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {tier.name}
                      {isCurrent && <span className="ml-2 text-xs text-indigo-600">(Current)</span>}
                    </div>
                    <div className="text-xs text-slate-600">
                      {tier.requirement === 0 ? 'Starting tier' : `${tier.requirement}+ conversions`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{tier.commission}%</div>
                  <div className="text-xs text-slate-500">commission</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export { TIER_CONFIG };