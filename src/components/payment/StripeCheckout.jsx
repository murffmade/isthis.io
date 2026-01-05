import React, { useState } from 'react';
import { base44Auth } from '@/components/api/base44ClientAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function StripeCheckout({ plan, children }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Check authentication
      let user;
      try {
        user = await base44Auth.auth.me();
      } catch (authError) {
        toast.error('Please sign in to continue');
        base44Auth.auth.redirectToLogin(window.location.pathname);
        return;
      }

      console.log('Starting checkout for plan:', plan.plan_key);

      // Create checkout session
      const response = await base44Auth.functions.invoke('createCheckoutSession', {
        plan_key: plan.plan_key
      });

      console.log('Checkout response:', response.data);

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

  // If children provided, use render prop pattern
  if (children) {
    return children({ handleCheckout, loading });
  }

  // Default button
  return (
    <button
      onClick={handleCheckout}
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
  );
}