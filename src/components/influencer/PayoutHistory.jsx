import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function PayoutHistory({ influencerId }) {
  const { data: payouts = [] } = useQuery({
    queryKey: ['influencerPayouts', influencerId],
    queryFn: async () => {
      return await base44.entities.Payout.filter({ influencer_id: influencerId });
    },
    enabled: !!influencerId
  });

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
    processing: { icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Processing' },
    completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' }
  };

  const totalPaid = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((sum, p) => sum + p.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-6">Payout History</h3>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="text-sm text-emerald-700 mb-1">Total Paid Out</div>
          <div className="text-2xl font-bold text-emerald-900">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-700 mb-1">Pending/Processing</div>
          <div className="text-2xl font-bold text-amber-900">${pendingAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Payout List */}
      <div className="space-y-3">
        {payouts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No payouts yet</p>
            <p className="text-sm">Payouts are processed once you reach the minimum threshold</p>
          </div>
        ) : (
          payouts.map(payout => {
            const config = statusConfig[payout.status];
            const Icon = config.icon;

            return (
              <div key={payout.id} className={`p-4 rounded-lg ${config.bg} border border-slate-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <div>
                      <div className="font-semibold text-slate-900">${payout.amount.toFixed(2)}</div>
                      <div className="text-xs text-slate-600">
                        {new Date(payout.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} ${config.bg}`}>
                    {config.label}
                  </div>
                </div>
                {payout.transaction_id && (
                  <div className="mt-2 text-xs text-slate-600">
                    Transaction ID: {payout.transaction_id}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}