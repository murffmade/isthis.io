import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44Public } from '@/components/api/base44ClientPublic';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { base44Auth } from '@/components/api/base44ClientAuth';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PaymentSuccess() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useCurrentUser();
  const [verificationState, setVerificationState] = useState('verifying'); // verifying | success | pending | error
  const [paymentData, setPaymentData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setVerificationState('error');
      return;
    }

    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      // PUBLIC endpoint - works even if logged out
      const response = await base44Public.functions.invoke('verifyPayment', {
        session_id: sessionId
      });

      if (response.data.success && response.data.paid) {
        setPaymentData(response.data);
        
        if (response.data.status === 'active') {
          // Payment confirmed and entitlement active
          setVerificationState('success');
          
          // Invalidate entitlement cache
          queryClient.invalidateQueries({ queryKey: ['entitlement'] });
          
          // Celebration!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else if (response.data.status === 'pending') {
          // Payment confirmed but entitlement still processing
          setVerificationState('pending');
          
          // Retry after delay (exponential backoff)
          if (retryCount < 10) {
            const delay = Math.min(2000 * Math.pow(1.5, retryCount), 10000);
            setTimeout(() => {
              setRetryCount(retryCount + 1);
              verifyPayment();
            }, delay);
          }
        }
      } else {
        setVerificationState('error');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationState('error');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
          <p className="text-slate-600 mb-6">This payment link is invalid or has expired.</p>
          <Link
            to={createPageUrl('Pricing')}
            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold"
          >
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  if (verificationState === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment</h2>
          <p className="text-slate-600">Please wait while we confirm your purchase...</p>
        </div>
      </div>
    );
  }

  if (verificationState === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Processing Your Purchase</h1>
          <p className="text-slate-600 mb-4">
            Your payment was successful! We're activating your subscription now.
          </p>
          <p className="text-sm text-slate-500">
            This usually takes just a few seconds... (Attempt {retryCount + 1}/10)
          </p>
        </div>
      </div>
    );
  }

  if (verificationState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Confirmed</h1>
          <p className="text-slate-600 mb-6">
            We couldn't verify your payment. If you were charged, please contact support.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to={createPageUrl('Support')}
              className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg font-semibold"
            >
              Contact Support
            </Link>
            <Link
              to={createPageUrl('Account')}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold"
            >
              Go to Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="text-center max-w-2xl mx-auto p-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-xl text-slate-600 mb-8">
          Welcome to premium! Your subscription is now active.
        </p>

        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">What's Next?</h2>
          <ul className="text-left space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Access unlimited AI verifications</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Get priority analysis speed</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Manage your subscription anytime</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link
                to={createPageUrl('Home')}
                className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-colors"
              >
                Start Verifying
              </Link>
              <Link
                to={createPageUrl('Account')}
                className="px-8 py-4 bg-slate-200 text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-300 transition-colors"
              >
                View Account
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                base44Auth.auth.redirectToLogin(createPageUrl('Account'));
              }}
              className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-colors"
            >
              Sign In to Access Your Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}