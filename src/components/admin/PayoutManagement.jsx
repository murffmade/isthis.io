import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle2, Clock, AlertCircle, XCircle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MINIMUM_PAYOUT = 50; // $50 minimum

export default function PayoutManagement() {
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: influencers = [] } = useQuery({
    queryKey: ['influencersForPayout'],
    queryFn: () => base44.entities.InfluencerPartner.list()
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['allPayouts'],
    queryFn: () => base44.entities.Payout.list('-created_date')
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createPayoutMutation = useMutation({
    mutationFn: async ({ influencerId, amount, influencerEmail }) => {
      return await base44.entities.Payout.create({
        influencer_id: influencerId,
        influencer_email: influencerEmail,
        amount: parseFloat(amount),
        status: 'pending',
        notes: notes
      });
    },
    onSuccess: async (payout, variables) => {
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: variables.influencerEmail,
        subject: 'Payout Request Initiated - IsThis.io',
        body: `Your payout of $${variables.amount} has been initiated and is being processed. You'll receive another email once it's completed.`
      });
      
      queryClient.invalidateQueries(['allPayouts']);
      toast.success('Payout initiated');
      setIsDialogOpen(false);
      setSelectedInfluencer(null);
      setPayoutAmount('');
      setNotes('');
    }
  });

  const updatePayoutStatusMutation = useMutation({
    mutationFn: async ({ payoutId, status, transactionId }) => {
      const updateData = { 
        status,
        processed_by: currentUser?.email,
        processed_at: new Date().toISOString()
      };
      if (transactionId) updateData.transaction_id = transactionId;
      
      return await base44.entities.Payout.update(payoutId, updateData);
    },
    onSuccess: async (payout) => {
      // Send email on completion
      if (payout.status === 'completed') {
        await base44.integrations.Core.SendEmail({
          to: payout.influencer_email,
          subject: 'Payout Completed - IsThis.io',
          body: `Great news! Your payout of $${payout.amount} has been completed successfully.`
        });
      }
      
      queryClient.invalidateQueries(['allPayouts']);
      toast.success('Payout status updated');
    }
  });

  const eligibleInfluencers = influencers.filter(i => 
    (i.pending_payout || i.total_earnings || 0) >= MINIMUM_PAYOUT
  );

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    processing: { icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Pending Payouts</div>
          <div className="text-2xl font-bold text-slate-900">
            {payouts.filter(p => p.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-emerald-600">
            ${payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Eligible Influencers</div>
          <div className="text-2xl font-bold text-slate-900">
            {eligibleInfluencers.length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Min Threshold</div>
          <div className="text-2xl font-bold text-slate-900">
            ${MINIMUM_PAYOUT}
          </div>
        </div>
      </div>

      {/* Create Payout */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Initiate Payout</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700">
                <DollarSign className="w-4 h-4 mr-2" />
                New Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Select Influencer
                  </label>
                  <Select onValueChange={(id) => {
                    const inf = influencers.find(i => i.id === id);
                    setSelectedInfluencer(inf);
                    setPayoutAmount((inf.pending_payout || inf.total_earnings || 0).toFixed(2));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose influencer" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleInfluencers.map(inf => (
                        <SelectItem key={inf.id} value={inf.id}>
                          {inf.company_name} - ${(inf.pending_payout || inf.total_earnings || 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInfluencer && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Amount ($)
                      </label>
                      <Input
                        type="number"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        min={MINIMUM_PAYOUT}
                      />
                      {parseFloat(payoutAmount) < MINIMUM_PAYOUT && (
                        <p className="text-xs text-red-600 mt-1">
                          Minimum payout is ${MINIMUM_PAYOUT}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Notes (optional)
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes..."
                      />
                    </div>

                    <Button
                      onClick={() => createPayoutMutation.mutate({
                        influencerId: selectedInfluencer.id,
                        amount: payoutAmount,
                        influencerEmail: selectedInfluencer.created_by
                      })}
                      disabled={parseFloat(payoutAmount) < MINIMUM_PAYOUT || createPayoutMutation.isPending}
                      className="w-full"
                    >
                      Initiate Payout
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payouts List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Payouts</h3>
        <div className="space-y-3">
          {payouts.map(payout => {
            const config = statusConfig[payout.status];
            const Icon = config.icon;
            const influencer = influencers.find(i => i.id === payout.influencer_id);

            return (
              <div key={payout.id} className={`p-4 rounded-lg border-2 ${config.border} ${config.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <div>
                      <div className="font-semibold text-slate-900">
                        {influencer?.company_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Date(payout.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900">${payout.amount}</div>
                    <div className={`text-xs font-semibold ${config.color}`}>
                      {payout.status}
                    </div>
                  </div>
                </div>

                {payout.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => updatePayoutStatusMutation.mutate({
                        payoutId: payout.id,
                        status: 'processing'
                      })}
                    >
                      Mark Processing
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const txId = prompt('Enter transaction ID:');
                        if (txId) {
                          updatePayoutStatusMutation.mutate({
                            payoutId: payout.id,
                            status: 'completed',
                            transactionId: txId
                          });
                        }
                      }}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updatePayoutStatusMutation.mutate({
                        payoutId: payout.id,
                        status: 'failed'
                      })}
                    >
                      Mark Failed
                    </Button>
                  </div>
                )}

                {payout.status === 'processing' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        const txId = prompt('Enter transaction ID:');
                        if (txId) {
                          updatePayoutStatusMutation.mutate({
                            payoutId: payout.id,
                            status: 'completed',
                            transactionId: txId
                          });
                        }
                      }}
                    >
                      Complete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {payouts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No payouts yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}