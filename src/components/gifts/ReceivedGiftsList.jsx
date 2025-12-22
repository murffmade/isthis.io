import React from 'react';
import { motion } from 'framer-motion';
import { Gift, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function ReceivedGiftsList({ gifts, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4" />
        <p className="text-slate-500">Loading your received gifts...</p>
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Gifts Received Yet</h3>
        <p className="text-slate-500">When someone sends you a gift card, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gifts.map((gift, index) => (
        <motion.div
          key={gift.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Redeemed
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {gift.plan === 'annual' ? '1 Year Premium' : 'Lifetime Premium'}
                </span>
              </div>
              
              <div className="space-y-1 mb-3">
                <p className="text-slate-900 font-semibold">
                  From: {gift.sender_name || gift.sender_email}
                </p>
                {gift.message && (
                  <p className="text-sm text-slate-600 italic">"{gift.message}"</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span>Redeemed: {new Date(gift.redeemed_at).toLocaleDateString()}</span>
                <span>Plan: {gift.plan === 'annual' ? '1 Year' : 'Lifetime'} Premium Access</span>
              </div>
            </div>

            <Button
              onClick={() => window.location.href = createPageUrl('Account')}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Plan
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}