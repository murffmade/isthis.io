import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function StripeCheckout({ plan, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Note: This requires backend functions to be enabled
      // The backend should create a Stripe checkout session and return the URL
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a Stripe checkout session for plan: ${plan.name} at price: $${plan.price}`,
        response_json_schema: {
          type: "object",
          properties: {
            checkout_url: { type: "string" },
            session_id: { type: "string" }
          }
        }
      });

      // Redirect to Stripe checkout
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        toast.error('Payment system not configured. Please contact support.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Unable to start checkout. Backend functions may not be enabled.');
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