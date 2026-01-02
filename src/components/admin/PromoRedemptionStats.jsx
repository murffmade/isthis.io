import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketPercent, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function PromoRedemptionStats({ affiliateId }) {
  const { data: redemptions = [], isLoading } = useQuery({
    queryKey: ['affiliatePromoRedemptions', affiliateId],
    queryFn: () => base44.entities.PromoRedemption.filter({ 
      affiliate_partner_id: affiliateId 
    }),
    enabled: !!affiliateId
  });

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['affiliatePromoCodes', affiliateId],
    queryFn: async () => {
      const codes = await base44.entities.PromoCode.filter({ 
        affiliate_partner_id: affiliateId 
      });
      return codes;
    },
    enabled: !!affiliateId
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const totalRedemptions = redemptions.length;
  const uniqueUsers = new Set(redemptions.map(r => r.redeemed_by_email)).size;
  
  // Calculate earnings based on redemptions
  const totalEarnings = redemptions.reduce((sum, redemption) => {
    // Estimate commission: $29 annual = ~$8.70, lifetime would be more
    // This is a rough estimate - actual commission tracked in AffiliatePartner
    return sum + 8.70; // Average commission per redemption
  }, 0);

  const stats = [
    { label: 'Active Promo Codes', value: promoCodes.filter(p => p.status === 'active').length, icon: TicketPercent, color: 'text-blue-600' },
    { label: 'Total Redemptions', value: totalRedemptions, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Unique Users', value: uniqueUsers, icon: Users, color: 'text-purple-600' },
    { label: 'Est. Earnings', value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'text-amber-600' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-xs text-slate-600">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {promoCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Promo Codes</CardTitle>
            <CardDescription>Track performance of your promotional codes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {promoCodes.map((promo) => {
                const promoRedemptions = redemptions.filter(r => r.promo_code_id === promo.id);
                return (
                  <div key={promo.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="font-mono font-bold text-slate-900">{promo.code}</code>
                        <div className="text-sm text-slate-600 mt-1">
                          {promoRedemptions.length} redemption{promoRedemptions.length !== 1 ? 's' : ''}
                          {promo.max_redemptions_total && (
                            <span className="ml-2">/ {promo.max_redemptions_total} max</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        promo.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {promo.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Redemptions</CardTitle>
            <CardDescription>Latest promo code uses from your referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {redemptions.slice(0, 10).map((redemption) => {
                const promo = promoCodes.find(p => p.id === redemption.promo_code_id);
                return (
                  <div key={redemption.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                    <div>
                      <div className="font-medium text-slate-900">{redemption.redeemed_by_email}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(redemption.created_date).toLocaleDateString()}
                        {promo && <span className="ml-2">• Code: {promo.code}</span>}
                      </div>
                    </div>
                    {redemption.gift_code_ids?.length > 0 && (
                      <span className="text-xs text-slate-500">
                        +{redemption.gift_code_ids.length} gift{redemption.gift_code_ids.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}