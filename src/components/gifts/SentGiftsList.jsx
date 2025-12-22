import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, Mail, MoreVertical, Copy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getGiftStatus = (gift) => {
  const now = new Date();
  const expiresAt = new Date(gift.expires_at);
  
  if (gift.redeemed) {
    return { status: 'redeemed', label: 'Redeemed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
  } else if (expiresAt < now) {
    return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle };
  } else {
    return { status: 'active', label: 'Active', color: 'bg-blue-100 text-blue-700', icon: Clock };
  }
};

export default function SentGiftsList({ gifts, loading }) {
  const queryClient = useQueryClient();

  const extendExpirationMutation = useMutation({
    mutationFn: async (giftId) => {
      const gift = gifts.find(g => g.id === giftId);
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 90); // Extend by 90 days
      
      return base44.entities.GiftCode.update(giftId, {
        expires_at: newExpiresAt.toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sentGifts']);
      toast.success('Gift expiration extended by 90 days');
    },
    onError: () => {
      toast.error('Failed to extend expiration');
    }
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (gift) => {
      const giftUrl = `${window.location.origin}${createPageUrl('GiftRedemption')}?gift=${gift.code}`;
      
      return base44.integrations.Core.SendEmail({
        to: gift.sender_email, // Send to sender so they can forward
        subject: 'Your IsThis.io Gift Card - Resend',
        body: `Hi,\n\nHere's the gift card you sent${gift.recipient_name ? ` to ${gift.recipient_name}` : ''}:\n\nGift Link: ${giftUrl}\n\nPlan: ${gift.plan === 'annual' ? '1 Year Premium' : 'Lifetime Premium'}\nExpires: ${new Date(gift.expires_at).toLocaleDateString()}\n\nYou can share this link with the recipient.\n\nBest,\nIsThis.io Team`
      });
    },
    onSuccess: () => {
      toast.success('Gift card link sent to your email');
    },
    onError: () => {
      toast.error('Failed to resend email');
    }
  });

  const copyGiftLink = (gift) => {
    const giftUrl = `${window.location.origin}${createPageUrl('GiftRedemption')}?gift=${gift.code}`;
    navigator.clipboard.writeText(giftUrl);
    toast.success('Gift link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4" />
        <p className="text-slate-500">Loading your gifts...</p>
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Gifts Sent Yet</h3>
        <p className="text-slate-500 mb-6">You haven't sent any gift cards yet.</p>
        <Button
          onClick={() => window.location.href = createPageUrl('HolidayGift')}
          className="bg-slate-900 hover:bg-slate-800"
        >
          Send Your First Gift
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gifts.map((gift, index) => {
        const statusInfo = getGiftStatus(gift);
        const StatusIcon = statusInfo.icon;
        
        return (
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {gift.plan === 'annual' ? '1 Year Premium' : 'Lifetime Premium'}
                  </span>
                </div>
                
                <div className="space-y-1 mb-3">
                  {gift.recipient_name && (
                    <p className="text-slate-900 font-semibold">To: {gift.recipient_name}</p>
                  )}
                  {gift.message && (
                    <p className="text-sm text-slate-600 italic">"{gift.message}"</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>Sent: {new Date(gift.created_date).toLocaleDateString()}</span>
                  <span>Expires: {new Date(gift.expires_at).toLocaleDateString()}</span>
                  {gift.redeemed && gift.redeemed_at && (
                    <span className="text-emerald-600">Redeemed: {new Date(gift.redeemed_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {!gift.redeemed && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyGiftLink(gift)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Gift Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => resendEmailMutation.mutate(gift)}>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend to My Email
                    </DropdownMenuItem>
                    {statusInfo.status === 'expired' && (
                      <DropdownMenuItem onClick={() => extendExpirationMutation.mutate(gift.id)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Extend Expiration
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}