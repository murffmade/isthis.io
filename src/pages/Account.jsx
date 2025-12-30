import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Crown, Infinity, ArrowLeft, Check, Loader2, User, Mail, MapPin, Clock, CreditCard, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import moment from 'moment';
import StripeCheckout from '@/components/payment/StripeCheckout';
import BottomNav from '@/components/mobile/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, Receipt, CreditCard as CreditCardIcon } from 'lucide-react';

const planConfig = {
  free: {
    icon: Shield,
    name: 'Free Plan',
    color: 'slate',
    benefits: [
      '5 verifications per month',
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      if (!currentUser) return null;
      const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email });
      return subs[0] || null;
    },
    enabled: !!currentUser
  });

  const { data: billingInfo } = useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => {
      const result = await base44.functions.invoke('getBillingInfo', {});
      return result.data;
    },
    enabled: !!currentUser && !!subscription && subscription.plan !== 'free'
  });

  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('createCustomerPortal', {});
      return result.data;
    },
    onSuccess: (data) => {
      if (data.success && data.portal_url) {
        window.location.href = data.portal_url;
      } else {
        toast.error('Unable to open billing portal');
      }
    },
    onError: () => toast.error('Failed to open billing portal')
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData) => base44.auth.updateMe(userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile')
  });

  React.useEffect(() => {
    if (currentUser && !isEditing) {
      setEditedUser({
        full_name: currentUser.full_name || '',
        location: currentUser.location || '',
        bio: currentUser.bio || ''
      });
    }
  }, [currentUser, isEditing]);

  const handleLogout = () => {
    base44.auth.logout();
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  if (userLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Please Sign In</h2>
          <p className="text-slate-600 mb-6">You need to be logged in to view your account.</p>
          <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const planDetails = planConfig[currentPlan] || planConfig.free;
  const Icon = planDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">IsThis.io</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Account & Subscription</p>
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

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Account Information</h2>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button
                  onClick={() => updateUserMutation.mutate(editedUser)}
                  disabled={updateUserMutation.isPending}
                  size="sm"
                >
                  {updateUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={editedUser.full_name || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                  placeholder="Enter your name"
                />
              ) : (
                <div className="text-slate-900 font-medium">{currentUser?.full_name || 'Not set'}</div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <div className="text-slate-900 font-medium">{currentUser?.email}</div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              {isEditing ? (
                <Input
                  value={editedUser.location || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                  placeholder="City, Country"
                />
              ) : (
                <div className="text-slate-900 font-medium">{currentUser?.location || 'Not set'}</div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4" />
                Member Since
              </label>
              <div className="text-slate-900 font-medium">
                {moment(currentUser?.created_date).format('MMMM YYYY')}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${planDetails.color}-600 to-${planDetails.color}-700 flex items-center justify-center`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{planDetails.name}</h2>
              <p className="text-slate-600">
                Status: <span className={`font-medium ${subscription?.status === 'active' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Active'}
                </span>
              </p>
            </div>
          </div>

          {subscription && subscription.plan !== 'free' && (
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

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Your Benefits</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {planDetails.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {subscription && subscription.plan !== 'free' && subscription.stripe_customer_id && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Button
                onClick={() => createPortalMutation.mutate()}
                disabled={createPortalMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {createPortalMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Billing & Payments
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Billing History */}
        {subscription && subscription.plan !== 'free' && billingInfo?.billing_history?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <Receipt className="w-5 h-5 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900">Billing History</h2>
            </div>

            <div className="space-y-3">
              {billingInfo.billing_history.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-900">
                      ${(charge.amount / 100).toFixed(2)} {charge.currency.toUpperCase()}
                    </div>
                    <div className="text-sm text-slate-500">
                      {moment.unix(charge.created).format('MMM D, YYYY')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      charge.status === 'succeeded' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {charge.status}
                    </span>
                    {charge.receipt_url && (
                      <a
                        href={charge.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Receipt
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Payment Methods */}
        {subscription && subscription.plan !== 'free' && billingInfo?.payment_methods?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <CreditCardIcon className="w-5 h-5 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900">Payment Methods</h2>
            </div>

            <div className="space-y-3">
              {billingInfo.payment_methods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-slate-200 rounded flex items-center justify-center">
                      <CreditCardIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 capitalize">
                        {pm.brand} •••• {pm.last4}
                      </div>
                      <div className="text-sm text-slate-500">
                        Expires {pm.exp_month}/{pm.exp_year}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-slate-600">
              Use "Manage Billing & Payments" above to add or remove cards
            </div>
          </motion.div>
        )}

        {/* Upgrade Options */}
        {currentPlan !== 'lifetime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {currentPlan === 'free' ? 'Upgrade Your Plan' : 'Upgrade to Lifetime'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {currentPlan === 'free' && (
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
                  />
                </div>
              )}

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-slate-900 p-6 text-white">
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
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Lifetime Message */}
        {currentPlan === 'lifetime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border-2 border-emerald-200 p-8 text-center"
          >
            <Infinity className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">You're All Set! 🎉</h2>
            <p className="text-slate-600">You have lifetime access to all features. Thank you!</p>
          </motion.div>
        )}

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 pt-8 border-t border-slate-200 text-center"
        >
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
          >
            Sign Out
          </button>
        </motion.div>
      </main>

      <BottomNav currentPage="account" />
    </div>
  );
}