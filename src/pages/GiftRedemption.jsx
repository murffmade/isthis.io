import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, Loader2, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';

export default function GiftRedemption() {
  const [giftCode, setGiftCode] = useState(null);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('loading'); // loading, preview, login_required, redeeming, success, error

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('gift');
    
    if (code) {
      setGiftCode(code);
      checkAuth();
    } else {
      setStep('error');
    }
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setStep('preview');
    } catch (error) {
      setStep('login_required');
    }
  };

  const { data: giftData, isLoading: loadingGift } = useQuery({
    queryKey: ['giftCode', giftCode],
    queryFn: async () => {
      const gifts = await base44.entities.GiftCode.filter({ code: giftCode });
      if (gifts.length === 0) throw new Error('Gift code not found');
      return gifts[0];
    },
    enabled: !!giftCode && step !== 'loading',
    retry: false
  });

  const redeemMutation = useMutation({
    mutationFn: async () => {
      if (!giftData || !user) throw new Error('Missing data');
      
      // Check if already redeemed
      if (giftData.redeemed) {
        throw new Error('This gift has already been redeemed');
      }

      // Check expiration
      if (giftData.expires_at && new Date(giftData.expires_at) < new Date()) {
        throw new Error('This gift code has expired');
      }

      // Create or update subscription
      const existingSubscriptions = await base44.entities.Subscription.filter({ 
        created_by: user.email 
      });

      const subscriptionData = {
        plan: giftData.plan,
        status: 'active',
        purchased_at: new Date().toISOString(),
        amount_paid: giftData.plan === 'lifetime' ? 9900 : 2900,
        expires_at: giftData.plan === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      if (existingSubscriptions.length > 0) {
        await base44.entities.Subscription.update(existingSubscriptions[0].id, subscriptionData);
      } else {
        await base44.entities.Subscription.create(subscriptionData);
      }

      // Mark gift as redeemed
      await base44.entities.GiftCode.update(giftData.id, {
        redeemed: true,
        redeemed_by: user.email,
        redeemed_at: new Date().toISOString()
      });

      // Send notification to sender
      try {
        await base44.integrations.Core.SendEmail({
          to: giftData.sender_email,
          subject: '🎁 Your Gift Has Been Redeemed!',
          body: `Great news! ${giftData.recipient_name || 'Your gift recipient'} has redeemed your IsThis.io Premium gift.\n\nThey now have ${giftData.plan === 'lifetime' ? 'lifetime' : '1 year of'} access to AI content verification.\n\nThank you for spreading digital safety this holiday season!\n\n- The IsThis.io Team`
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      return subscriptionData;
    },
    onSuccess: () => {
      setStep('success');
      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to redeem gift');
    }
  });

  const handleLogin = () => {
    const nextUrl = `${window.location.pathname}${window.location.search}`;
    base44.auth.redirectToLogin(nextUrl);
  };

  if (step === 'loading' || loadingGift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-emerald-900 to-blue-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading your gift...</p>
        </motion.div>
      </div>
    );
  }

  if (step === 'error' || !giftData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-emerald-900 to-blue-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Gift Not Found</h2>
          <p className="text-slate-600 mb-6">This gift code is invalid or has expired.</p>
          <Button
            onClick={() => window.location.href = createPageUrl('HolidayGift')}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800"
          >
            Browse Gift Options
          </Button>
        </motion.div>
      </div>
    );
  }

  // Check if expired
  const isExpired = giftData.expires_at && new Date(giftData.expires_at) < new Date();
  const daysUntilExpiry = giftData.expires_at ? Math.ceil((new Date(giftData.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-emerald-900 to-blue-900 flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === 'login_required' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full bg-white rounded-2xl p-8"
          >
            <div className="text-center mb-6">
              <Gift className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You've Received a Gift!</h2>
              <p className="text-slate-600">Log in or create an account to redeem your premium access</p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-700">
                {giftData.sender_name && `From: ${giftData.sender_name}`}
              </p>
              <p className="text-sm font-semibold text-emerald-700 mt-1">
                {giftData.plan === 'lifetime' ? 'Lifetime Premium Access' : '1 Year Premium Access'}
              </p>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 mb-3"
            >
              Log In or Sign Up to Redeem
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Your gift will be waiting after you log in
            </p>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg w-full bg-white rounded-2xl p-8"
          >
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Gift className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {giftData.recipient_name ? `${giftData.recipient_name}, you` : 'You'} received a gift! 🎁
              </h2>
              <p className="text-lg text-slate-600">
                {giftData.sender_name ? `From ${giftData.sender_name}` : 'Someone special sent you this'}
              </p>
            </div>

            {giftData.message && (
              <div className="bg-amber-50 rounded-xl p-4 mb-6 border-l-4 border-amber-400">
                <p className="text-sm text-slate-700 italic">"{giftData.message}"</p>
              </div>
            )}

            <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl p-6 text-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <Sparkles className="w-8 h-8" />
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                  {giftData.plan === 'lifetime' ? 'LIFETIME' : '1 YEAR'}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">IsThis.io Premium</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Unlimited AI content verification
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Advanced detection signals
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Priority support
                </li>
                {giftData.plan === 'lifetime' && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Lifetime access - forever!
                  </li>
                )}
              </ul>
            </div>

            {isExpired ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-semibold">This gift has expired</p>
                </div>
              </div>
            ) : daysUntilExpiry && daysUntilExpiry <= 7 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="w-5 h-5" />
                  <p className="font-semibold">Expires in {daysUntilExpiry} days</p>
                </div>
              </div>
            ) : null}

            {giftData.redeemed ? (
              <div className="bg-slate-100 rounded-xl p-4 text-center">
                <p className="text-slate-600">This gift has already been redeemed</p>
              </div>
            ) : (
              <Button
                onClick={() => redeemMutation.mutate()}
                disabled={redeemMutation.isPending || isExpired}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-lg font-semibold"
              >
                {redeemMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Redeem Your Gift
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full bg-white rounded-2xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <h2 className="text-3xl font-bold text-slate-900 mb-2">All Set! 🎉</h2>
            <p className="text-lg text-slate-600 mb-6">
              Your premium access is now active
            </p>

            <div className="bg-emerald-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-emerald-800">
                You now have {giftData.plan === 'lifetime' ? 'lifetime' : '1 year of'} unlimited access to AI content verification
              </p>
            </div>

            <Button
              onClick={() => window.location.href = createPageUrl('Home')}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 mb-3"
            >
              Start Verifying Content
            </Button>

            <Button
              onClick={() => window.location.href = createPageUrl('Account')}
              variant="outline"
              className="w-full h-12"
            >
              View Your Account
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}