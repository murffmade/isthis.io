import React, { useState } from 'react';
import { base44Auth } from '@/api/base44ClientAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function StripeCheckout({ plan, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Check authentication first
      try {
        await base44Auth.auth.me();
      } catch (authError) {
        toast.error('Please sign in to continue');
        const currentPath = window.location.pathname;
        base44Auth.auth.redirectToLogin(currentPath);
        return;
      }

      // Use plan_key only - server will determine pricing
      const result = await base44Auth.functions.invoke('createCheckoutSession', {
        plan_key: plan.key
      });

      if (result.data.success && result.data.checkout_url) {
        if (onSuccess && result.data.session_id) {
          await onSuccess(result.data.session_id);
        }
        window.location.href = result.data.checkout_url;
      } else {
        toast.error(result.data.error || 'Unable to start checkout');
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