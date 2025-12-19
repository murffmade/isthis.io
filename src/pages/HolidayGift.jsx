import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Gift, Sparkles, Check, ArrowLeft, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import GiftCardModal from '@/components/gift/GiftCardModal';
import Snowflakes from '@/components/effects/Snowflakes';

const plans = [
  {
    id: 'annual',
    name: '1 Year Premium',
    price: '$29',
    duration: '1 year',
    popular: false,
    features: [
      'Unlimited verifications',
      'Priority analysis speed',
      'Advanced detection signals',
      'Export verification reports',
      'Ad-free experience',
      '1 year of full access'
    ]
  },
  {
    id: 'lifetime',
    name: 'Lifetime Premium',
    price: '$99',
    duration: 'Lifetime',
    popular: true,
    features: [
      'Everything in Annual',
      'Lifetime access - forever',
      'Early access to new features',
      'Premium support',
      'Future AI model upgrades',
      'Best value - one-time payment'
    ]
  }
];

export default function HolidayGift() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showGiftCard, setShowGiftCard] = useState(false);

  const handlePurchase = (plan) => {
    setSelectedPlan(plan);
    setShowGiftCard(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative">
      <Snowflakes />
      
      {/* Festive Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Is This Real?</h1>
                <p className="text-xs text-slate-400">AI content verification</p>
              </div>
            </a>
            <a
              href={createPageUrl('Home')}
              className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-green-500/20 text-white text-sm mb-6 border border-white/20">
                <Clock className="w-4 h-4" />
                Last-Minute Gift Solution
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                The Perfect Gift for<br />Parents & Grandparents
              </h2>
              <p className="text-xl text-slate-300 mb-4">
                Help them navigate an AI-generated world. Give them confidence to verify what's real online.
              </p>
              <p className="text-lg text-emerald-400 mb-8">
                Instant digital delivery • Perfect for white elephant • Actually useful
              </p>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?w=800&q=80" 
                  alt="Grandparents using technology"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-slate-900">Verified: Real Photo</span>
                    </div>
                    <p className="text-sm text-slate-600">Help them spot the difference</p>
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 text-6xl">🎁</div>
              <div className="absolute -bottom-4 -left-4 text-5xl">🎄</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? 'border-emerald-400 bg-gradient-to-br from-emerald-500/10 to-green-500/10'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">one-time</span>
                  </div>
                  <p className="text-emerald-400 font-medium mt-2">{plan.duration} of access</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-200">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(plan)}
                  className={`w-full h-12 font-semibold ${
                    plan.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white'
                      : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Give This Gift
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Why They'll Love It</h3>
            <p className="text-slate-300">A gift that actually helps them stay safe and informed online</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Shield,
                title: 'Easy to Use',
                desc: 'Simple drag-and-drop interface. If they can use email, they can use this.'
              },
              {
                icon: Sparkles,
                title: 'Peace of Mind',
                desc: 'Help them spot fake news, scams, and AI-generated content before sharing.'
              },
              {
                icon: Gift,
                title: 'Instant Delivery',
                desc: 'Beautiful personalized card delivered instantly. Perfect for last-minute gifting.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 rounded-xl p-6 border border-white/10"
              >
                <feature.icon className="w-10 h-10 text-emerald-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Security Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&q=80"
              alt="Senior couple confidently using mobile device"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40 flex items-center">
              <div className="px-8 md:px-12 max-w-xl">
                <h4 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Browse with Confidence
                </h4>
                <p className="text-slate-200 text-lg">
                  No more second-guessing what's real. They'll feel secure knowing they can verify anything in seconds.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-12">Three Simple Steps</h3>
          <div className="space-y-6">
            {[
              { step: '1', text: 'Pick 1 Year or Lifetime access - both include everything' },
              { step: '2', text: 'Personalize a beautiful holiday card (optional message)' },
              { step: '3', text: 'Email, text, or print it - delivered instantly!' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center font-bold text-white flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-slate-200">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial with Images */}
      <section className="relative py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80"
                  alt="Customer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
                />
                <div>
                  <p className="text-white font-semibold">Sarah M.</p>
                  <p className="text-slate-400 text-sm">Verified Customer</p>
                </div>
              </div>
              <p className="text-slate-200 italic">
                "Got this for my mom for Christmas. She's always forwarding questionable stuff on Facebook. 
                Now she checks it first. Best $29 I've spent!"
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                  alt="Customer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
                />
                <div>
                  <p className="text-white font-semibold">Mike R.</p>
                  <p className="text-slate-400 text-sm">Verified Customer</p>
                </div>
              </div>
              <p className="text-slate-200 italic">
                "Perfect white elephant gift! Everyone wanted to steal it. Actually useful unlike the usual gag gifts."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-slate-400">
          <p>© 2024 Is This Real? • The gift that keeps them safe online</p>
        </div>
      </footer>

      {/* Gift Card Modal */}
      {showGiftCard && selectedPlan && (
        <GiftCardModal
          plan={selectedPlan}
          onClose={() => {
            setShowGiftCard(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
}