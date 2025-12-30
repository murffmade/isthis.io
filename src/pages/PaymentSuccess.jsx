import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';
import BottomNav from '@/components/mobile/BottomNav';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      
      if (!sessionId) {
        toast.error('Invalid payment session');
        setVerifying(false);
        return;
      }

      try {
        const result = await base44.functions.invoke('verifyPayment', {
          session_id: sessionId
        });

        if (result.data.success && result.data.paid) {
          setVerified(true);
          // Trigger confetti animation
          const duration = 3000;
          const end = Date.now() + duration;

          const frame = () => {
            confetti({
              particleCount: 2,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#10b981', '#3b82f6', '#8b5cf6']
            });
            confetti({
              particleCount: 2,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#10b981', '#3b82f6', '#8b5cf6']
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-slate-600 mb-6">Payment could not be verified. Please check your account or contact support.</p>
          <Link
            to={createPageUrl('Account')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Go to Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-6 pb-20 md:pb-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-lg text-slate-600 mb-8">
          Welcome to IsThis.io Premium! Your account has been upgraded and you now have unlimited access to all premium features.
        </p>

        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 mb-8">
          <h2 className="font-semibold text-slate-900 mb-3">What's included:</h2>
          <ul className="space-y-2 text-left">
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-emerald-500">✓</span>
              <span>Unlimited verifications</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-emerald-500">✓</span>
              <span>Priority analysis speed</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-emerald-500">✓</span>
              <span>Advanced detection signals</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-emerald-500">✓</span>
              <span>Export verification reports</span>
            </li>
          </ul>
        </div>

        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Start Verifying Content
          <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="text-sm text-slate-500 mt-6">
          A confirmation email has been sent to your inbox
        </p>
      </motion.div>

      <BottomNav />
    </div>
  );
}