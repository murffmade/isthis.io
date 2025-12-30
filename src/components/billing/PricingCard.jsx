import React, { useState } from 'react';
import { base44Auth } from '@/components/api/base44ClientAuth';
import { base44Public } from '@/components/api/base44ClientPublic';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';

export default function PricingCard({ plan, isPopular = false }) {
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useCurrentUser();

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      // Check authentication
      if (!isAuthenticated) {
        toast.error('Please sign in to continue');
        const returnUrl = `/pricing?plan=${plan.plan_key}`;
        base44Auth.auth.redirectToLogin(returnUrl);
        return;
      }

      // Call createCheckoutSession
      const response = await base44Auth.functions.invoke('createCheckoutSession', {
        plan_key: plan.plan_key
      });

      if (response.data.success && response.data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        toast.error(response.data.error || 'Unable to start checkout');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Unable to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const priceDisplay = (plan.price_cents / 100).toFixed(2);
  const intervalLabel = {
    month: '/month',
    year: '/year',
    one_time: 'one-time'
  }[plan.interval] || '';

  return (
    <div className={`relative bg-white rounded-2xl p-8 shadow-lg ${isPopular ? 'border-2 border-blue-500' : 'border border-slate-200'}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
          POPULAR
        </div>
      )}
      
      <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.display_name}</h3>
      
      {plan.description && (
        <p className="text-slate-600 text-sm mb-6">{plan.description}</p>
      )}
      
      <div className="mb-6">
        <span className="text-4xl font-extrabold text-slate-900">${priceDisplay}</span>
        <span className="text-slate-600 ml-2">{intervalLabel}</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {plan.features?.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-slate-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Get Started'
        )}
      </button>
    </div>
  );
}