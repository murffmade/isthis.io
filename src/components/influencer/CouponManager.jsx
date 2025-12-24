import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Plus, Copy, Trash2, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CouponManager({ influencer }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: coupons = [] } = useQuery({
    queryKey: ['influencerCoupons', influencer.id],
    queryFn: async () => {
      return await base44.entities.InfluencerCoupon.filter({ influencer_id: influencer.id });
    },
    enabled: !!influencer
  });

  const createCouponMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.InfluencerCoupon.create({
        influencer_id: influencer.id,
        influencer_code: influencer.influencer_code,
        coupon_code: couponCode.toUpperCase(),
        discount_percentage: discountPercentage,
        description: description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['influencerCoupons']);
      toast.success('Coupon created!');
      setIsDialogOpen(false);
      setCouponCode('');
      setDescription('');
    },
    onError: (error) => {
      toast.error('Failed to create coupon - code may already exist');
    }
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async ({ couponId, isActive }) => {
      return await base44.entities.InfluencerCoupon.update(couponId, { is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['influencerCoupons']);
      toast.success('Coupon status updated');
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId) => {
      return await base44.entities.InfluencerCoupon.delete(couponId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['influencerCoupons']);
      toast.success('Coupon deleted');
    }
  });

  const generateRandomCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCouponCode(`${influencer.influencer_code.substring(0, 4).toUpperCase()}${random}`);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied!');
  };

  const totalUsage = coupons.reduce((sum, c) => sum + c.usage_count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Coupon Codes</h3>
          <p className="text-sm text-slate-600">Create trackable discount codes for your audience</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              New Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Coupon Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="SAVE10"
                    maxLength={20}
                  />
                  <Button variant="outline" onClick={generateRandomCode}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Use letters and numbers only</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Discount Percentage
                </label>
                <Input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-slate-500 mt-1">Maximum 100%</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Description (optional)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., YouTube exclusive"
                />
              </div>

              <Button
                onClick={() => createCouponMutation.mutate()}
                disabled={!couponCode || createCouponMutation.isPending}
                className="w-full"
              >
                Create Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="text-sm text-indigo-700 mb-1">Active Coupons</div>
          <div className="text-2xl font-bold text-indigo-900">{coupons.filter(c => c.is_active).length}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
          <div className="text-sm text-emerald-700 mb-1">Total Uses</div>
          <div className="text-2xl font-bold text-emerald-900">{totalUsage}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-700 mb-1">Best Performer</div>
          <div className="text-2xl font-bold text-amber-900">
            {coupons.length > 0 ? Math.max(...coupons.map(c => c.usage_count)) : 0}
          </div>
        </div>
      </div>

      {/* Coupon List */}
      <div className="space-y-3">
        {coupons.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No coupons yet</p>
            <p className="text-sm">Create your first coupon code to share with your audience</p>
          </div>
        ) : (
          coupons.map(coupon => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border-2 transition-colors ${
                coupon.is_active
                  ? 'bg-white border-slate-200 hover:border-indigo-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    coupon.is_active ? 'bg-indigo-100' : 'bg-slate-200'
                  }`}>
                    <Ticket className={`w-5 h-5 ${coupon.is_active ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      {coupon.coupon_code}
                      <button
                        onClick={() => copyCode(coupon.coupon_code)}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-600">
                      {coupon.discount_percentage}% off • {coupon.usage_count} uses
                      {coupon.description && ` • ${coupon.description}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCouponMutation.mutate({ couponId: coupon.id, isActive: coupon.is_active })}
                    className="p-2 hover:bg-slate-100 rounded transition-colors"
                  >
                    {coupon.is_active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this coupon? This cannot be undone.')) {
                        deleteCouponMutation.mutate(coupon.id);
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
              {coupon.usage_count > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                    <span>Generating revenue through conversions</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}