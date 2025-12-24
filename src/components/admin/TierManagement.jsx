import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TIER_CONFIG } from '@/components/influencer/TierProgress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TierManagement() {
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const queryClient = useQueryClient();

  const { data: influencers = [] } = useQuery({
    queryKey: ['allInfluencers'],
    queryFn: () => base44.entities.InfluencerPartner.list()
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ influencerId, tier }) => {
      const tierConfig = TIER_CONFIG[tier];
      await base44.entities.InfluencerPartner.update(influencerId, {
        current_tier: tier,
        commission_rate: tierConfig.commission
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allInfluencers']);
      toast.success('Influencer tier updated');
    }
  });

  const influencersByTier = React.useMemo(() => {
    return Object.keys(TIER_CONFIG).reduce((acc, tier) => {
      acc[tier] = influencers.filter(i => i.current_tier === tier);
      return acc;
    }, {});
  }, [influencers]);

  return (
    <div className="space-y-6">
      {/* Tier Distribution */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Tier Distribution</h3>
        <div className="grid md:grid-cols-5 gap-4">
          {Object.entries(TIER_CONFIG).map(([key, tier]) => {
            const count = influencersByTier[key]?.length || 0;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${tier.color} rounded-xl p-4 text-white`}
              >
                <div className="text-3xl mb-2">{tier.icon}</div>
                <div className="font-bold text-lg">{tier.name}</div>
                <div className="text-sm opacity-90 mb-2">{tier.commission}% commission</div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{count} influencer{count !== 1 ? 's' : ''}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Influencer List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Manage Influencer Tiers</h3>
        
        <div className="space-y-3">
          {influencers.map((influencer) => {
            const tier = TIER_CONFIG[influencer.current_tier] || TIER_CONFIG.bronze;
            
            return (
              <div
                key={influencer.id}
                className="p-4 rounded-lg border-2 border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl`}>
                      {tier.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {influencer.company_name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {influencer.total_conversions} conversions • ${influencer.total_earnings?.toFixed(2) || '0.00'} earned
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {tier.name} ({tier.commission}%)
                      </div>
                      <div className="text-xs text-slate-500">Current Tier</div>
                    </div>
                    
                    <Select
                      onValueChange={(tier) => updateTierMutation.mutate({ influencerId: influencer.id, tier })}
                      defaultValue={influencer.current_tier}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIER_CONFIG).map(([key, t]) => (
                          <SelectItem key={key} value={key}>
                            {t.icon} {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {influencers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No influencers yet
          </div>
        )}
      </div>
    </div>
  );
}