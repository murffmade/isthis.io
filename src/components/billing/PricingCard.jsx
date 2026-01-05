import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import StripeCheckout from '@/components/payment/StripeCheckout';

export default function PricingCard({ plan, isPopular = false }) {
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
      
      <StripeCheckout plan={plan} />
    </div>
  );
}