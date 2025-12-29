import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function StripeCheckout({ plan, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('createCheckoutSession', {
        plan_name: plan.name,
        price_cents: plan.price * 100 // Convert dollars to cents
      });

      if (result.data.success && result.data.checkout_url) {
        // For gifts, call onSuccess with session ID before redirect if available
        if (onSuccess && result.data.session_id) {
          await onSuccess(result.data.session_id);
        }
        window.location.href = result.data.checkout_url;
      } else {
        toast.error(result.data.error || 'Payment system not configured. Please set up Stripe in your dashboard.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Unable to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        plan.buttonText || 'Get Started'
      )}
    </button>
  );
}