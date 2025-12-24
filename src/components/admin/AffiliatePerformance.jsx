import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Users, TrendingUp, MousePointer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AffiliatePerformance() {
  const { data: partners = [] } = useQuery({
    queryKey: ['allInfluencers'],
    queryFn: () => base44.entities.InfluencerPartner.list()
  });

  const { data: clicks = [] } = useQuery({
    queryKey: ['allInfluencerClicks'],
    queryFn: () => base44.entities.InfluencerClick.list()
  });

  const totalPartners = partners.length;
  const activePartners = partners.filter(p => p.status === 'active').length;
  const totalClicks = clicks.length;
  const totalConversions = clicks.filter(c => c.converted).length;
  const totalEarnings = clicks
    .filter(c => c.converted)
    .reduce((sum, c) => sum + (c.conversion_value * 0.3), 0);

  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <div className="text-sm text-slate-600">Total Partners</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalPartners}</div>
          <div className="text-xs text-slate-500 mt-1">{activePartners} active</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <MousePointer className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-slate-600">Total Clicks</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalClicks}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div className="text-sm text-slate-600">Conversions</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalConversions}</div>
          <div className="text-xs text-slate-500 mt-1">{conversionRate}% rate</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <div className="text-sm text-slate-600">Total Payouts</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">${totalEarnings.toFixed(2)}</div>
        </motion.div>
      </div>

      {/* Top Partners */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Top Performing Influencers</h3>
        <div className="space-y-3">
          {partners
            .sort((a, b) => b.total_earnings - a.total_earnings)
            .slice(0, 5)
            .map((partner, i) => (
              <div key={partner.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{partner.company_name}</div>
                    <div className="text-xs text-slate-500">
                      {partner.total_referrals} referrals • {partner.total_conversions} conversions
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">${partner.total_earnings.toFixed(2)}</div>
                  <div className="text-xs text-slate-500">{partner.commission_rate}% rate</div>
                </div>
              </div>
            ))}
          {partners.length === 0 && (
            <div className="text-center py-8 text-slate-500">No influencers yet</div>
          )}
        </div>
      </div>
    </div>
  );
}