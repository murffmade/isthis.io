import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44Public } from '@/components/api/base44ClientPublic';
import PricingCard from '@/components/billing/PricingCard';
import { Loader2 } from 'lucide-react';
import BottomNav from '@/components/mobile/BottomNav';

export default function PricingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await base44Public.functions.invoke('getPlanCatalog', {});
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load pricing plans</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const plans = data.plans || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600">
            Select the perfect plan for your needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <PricingCard
              key={plan.plan_key}
              plan={plan}
              isPopular={idx === 1} // Middle card is popular
            />
          ))}
        </div>

        <div className="mt-16 text-center text-slate-600 text-sm">
          <p>All plans include our AI detection technology.</p>
          <p>Cancel anytime. No hidden fees.</p>
        </div>
      </div>
      
      <BottomNav currentPage="pricing" />
    </div>
  );
}