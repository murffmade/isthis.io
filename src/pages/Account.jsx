import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Crown, Infinity, Calendar, CreditCard, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import moment from 'moment';
import StripeCheckout from '@/components/payment/StripeCheckout';

const planConfig = {
  free: {
    icon: Shield,
    name: 'Free Plan',
    color: 'slate',
    benefits: [
      '5 verifications per day',
      'Basic detection signals',
      'Image & video support'
    ]
  },
  annual: {
    icon: Crown,
    name: 'Annual Premium',
    color: 'blue',
    price: 29,
    benefits: [
      'Unlimited verifications',
      'Priority analysis speed',
      'Advanced detection signals',
      'Export verification reports',
      '1 year of full access'
    ]
  },
  lifetime: {
    icon: Infinity,
    name: 'Lifetime Premium',
    color: 'emerald',
    price: 99,
    benefits: [
      'Everything in Annual',
      'Lifetime access - forever',
      'Early access to new features',
      'Premium support',
      'Future AI model upgrades'
    ]
  }
};

export default function AccountPage() {
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: () => base44.functions.getCurrentSubscription({})
  });

  const portalMutation = useMutation({
    mutationFn: () => base44.functions.getCustomerPortalUrl({}),
    onSuccess: (result) => {
      if (result.success && result.portal_url) {
        window.location.href = result.portal_url;
      } else {
        toast.error(result.error || 'Unable to access payment portal');
      }
    },
    onError: () => {
      toast.error('Failed to load payment portal');
    }
  });

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries(['currentSubscription']);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  const subscription = subscriptionData?.subscription || { plan: 'free', status: 'active' };
  const currentPlan = planConfig[subscription.plan];
  const Icon = currentPlan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500">Account & Subscription</p>
              </div>
            </Link>

            <Link
              to={createPageUrl('Home')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${currentPlan.color}-600 to-${currentPlan.color}-700 flex items-center justify-center`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{currentPlan.name}</h2>
                <p className="text-slate-600">
                  Status: <span className={`font-medium ${subscription.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </p>
              </div>
            </div>

            {subscription.plan !== 'free' && subscription.stripe_customer_id && (
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border-2 border-slate-300 rounded-xl text-slate-700 hover:border-slate-400 transition-colors disabled:opacity-50"
              >
                {portalMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage Billing
              </button>
            )}
          </div>

          {/* Subscription Details */}
          {subscription.plan !== 'free' && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {subscription.purchased_at && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Purchased</div>
                    <div className="font-medium text-slate-900">
                      {moment(subscription.purchased_at).format('MMM D, YYYY')}
                    </div>
                  </div>
                </div>
              )}

              {subscription.expires_at && subscription.plan === 'annual' && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Expires</div>
                    <div className="font-medium text-slate-900">
                      {moment(subscription.expires_at).format('MMM D, YYYY')}
                      <span className="text-sm text-slate-500 ml-2">
                        ({moment(subscription.expires_at).fromNow()})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {subscription.plan === 'lifetime' && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                  <Infinity className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm text-emerald-600">Never Expires</div>
                    <div className="font-medium text-emerald-900">Lifetime Access</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Plan Benefits */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Your Benefits</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {currentPlan.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Upgrade Options */}
        {subscription.plan !== 'lifetime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {subscription.plan === 'free' ? 'Upgrade Your Plan' : 'Upgrade to Lifetime'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {subscription.plan === 'free' && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Annual Premium</h3>
                      <div className="text-2xl font-bold text-slate-900">$29</div>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {planConfig.annual.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <StripeCheckout
                    plan={{ name: '1 Year Premium', price: 29, buttonText: 'Upgrade to Annual' }}
                    onSuccess={handlePaymentSuccess}
                  />
                </div>
              )}

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-slate-900 p-6 text-white relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold">
                  BEST VALUE
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Infinity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Lifetime Premium</h3>
                    <div className="text-2xl font-bold">$99</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {planConfig.lifetime.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <StripeCheckout
                  plan={{ name: 'Lifetime Premium', price: 99, buttonText: 'Upgrade to Lifetime' }}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* All Access Message for Lifetime */}
        {subscription.plan === 'lifetime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border-2 border-emerald-200 p-8 text-center"
          >
            <Infinity className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              You're All Set! 🎉
            </h2>
            <p className="text-slate-600">
              You have lifetime access to all IsThis.io features. Thank you for your support!
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}