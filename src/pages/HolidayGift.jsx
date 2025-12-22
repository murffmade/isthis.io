import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Gift, Sparkles, Check, ArrowLeft, Star, Clock, CheckCircle, AlertTriangle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import GiftCardModal from '@/components/gift/GiftCardModal';
import Snowflakes from '@/components/effects/Snowflakes';
import InteractiveSteps from '@/components/gift/InteractiveSteps';
import CountdownBanner from '@/components/gift/CountdownBanner';

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
      '1 year of full access'
    ]
  },
  {
    id: 'lifetime',
    name: 'Lifetime Premium',
    price: '$99',
    duration: 'Lifetime',
    popular: true,
    limitedOffer: 'Only until Dec 26th, 2025',
    features: [
      'Everything in Annual',
      'Lifetime access - forever',
      'Early access to new features',
      'Premium support',
      'Future AI model upgrades'
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
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-emerald-900 to-blue-900 relative">
      <Snowflakes />
      
      {/* Festive Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/20 bg-gradient-to-r from-red-500/10 via-emerald-500/10 to-blue-500/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">IsThis.io</h1>
                <p className="text-xs text-emerald-300">AI content verification</p>
              </div>
            </a>

          </div>
        </div>
      </header>

      {/* Top Callout */}
      <div className="relative py-8 px-6 border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-emerald-900/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-lg md:text-xl font-semibold text-white mb-2">Give the</p>
          <p className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 mb-4">
            GIFT of KNOWING
          </p>
          <p className="text-2xl md:text-4xl font-bold text-white leading-tight">
            help your loved ones stay <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">safe</span> from <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">A.I.</span>, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">misinformation</span>, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">scams</span> - online and off ✨
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 text-white text-sm font-semibold mb-6 shadow-lg">
                <Clock className="w-4 h-4" />
                Last-Minute Gift Solution 🎁
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                The Perfect Gift for<br />
                <span className="bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                  Parents & Grandparents
                </span>
              </h2>
              <p className="text-xl text-white/90 mb-4">
                Help them navigate an AI-generated world. Give them confidence to verify what's real online.
              </p>
              <div className="flex flex-wrap gap-3 text-base mb-8">
                <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ⚡ Instant digital delivery
                </span>
                <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  🎉 Perfect for white elephant
                </span>
                <span className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ✨ Actually useful
                </span>
              </div>
            </motion.div>

            {/* Right: Image Gallery */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Real Image 1 */}
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-lg group">
                  <img 
                    src="https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?w=400&q=80" 
                    alt="Real photo"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-emerald-500 rounded-full shadow-lg">
                    <span className="text-xs font-bold text-white">✓ REAL</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium">Natural lighting & shadows</p>
                    <p className="text-xs text-emerald-300">Realistic hand positions</p>
                  </div>
                </div>

                {/* AI Image 1 */}
                <div className="relative rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg group">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6944863d2abd893ac6b0098f/21d760444_image.png" 
                    alt="AI generated image"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-amber-500 rounded-full shadow-lg">
                    <span className="text-xs font-bold text-white">⚠️ AI</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium">Artificial skin smoothing</p>
                    <p className="text-xs text-amber-300">Unrealistic details</p>
                  </div>
                </div>

                {/* AI Image 3 */}
                <div className="relative rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg group">
                  <img 
                    src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=80" 
                    alt="AI generated city"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-amber-500 rounded-full shadow-lg">
                    <span className="text-xs font-bold text-white">⚠️ AI</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium">Impossible architecture</p>
                    <p className="text-xs text-amber-300">Repeating patterns</p>
                  </div>
                </div>

                {/* Real Image 3 */}
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-lg group">
                  <img 
                    src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80" 
                    alt="Real Tuscany landscape"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-emerald-500 rounded-full shadow-lg">
                    <span className="text-xs font-bold text-white">✓ REAL</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium">Natural landscape depth</p>
                    <p className="text-xs text-emerald-300">Authentic atmospheric haze</p>
                  </div>
                </div>
              </div>

              {/* Message Below Images */}
              <div className="mt-4 text-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 pb-10 shadow-2xl border-4 border-blue-500 inline-block relative">
                  <p className="text-lg font-bold text-slate-900 mb-1">Can you tell the difference?</p>
                  <p className="text-sm text-slate-600">They'll know instantly ✨</p>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-5xl">🎄</div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 text-6xl animate-bounce">🎁</div>
              <div className="absolute top-1/2 -left-8 text-4xl">⭐</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4 Pillars */}
      <section className="relative py-16 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">4 Ways to Verify Anything Online</h3>
            <p className="text-xl text-slate-300">One tool, complete protection for your loved ones</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Is This Real?',
                Icon: Shield,
                gradient: 'from-slate-900 via-slate-800 to-slate-700',
                bgImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
                description: 'Detect AI-generated images, videos, and deepfakes instantly'
              },
              {
                title: 'Is This True?',
                Icon: CheckCircle,
                gradient: 'from-blue-900 via-blue-700 to-blue-600',
                bgImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
                description: 'Verify news, claims, and facts with reliable sources'
              },
              {
                title: 'Is This a Scam?',
                Icon: AlertTriangle,
                gradient: 'from-amber-900 via-amber-700 to-amber-600',
                bgImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
                description: 'Check messages, emails, and listings for fraud'
              },
              {
                title: 'Is This Safe?',
                Icon: Heart,
                gradient: 'from-emerald-900 via-emerald-700 to-emerald-600',
                bgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
                description: 'Get safety guidance for decisions and situations'
              }
            ].map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl p-6 border-2 border-white/20 hover:border-white/40 transition-all group overflow-hidden"
              >
                {/* Background Image with Gradient Overlay */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                  <img 
                    src={pillar.bgImage} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} mix-blend-multiply`} />
                </div>
                
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-80 backdrop-blur-sm`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/30`}>
                    <pillar.Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{pillar.title}</h4>
                  <p className="text-slate-200">{pillar.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 px-6">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-4">How It Works</h3>
          <p className="text-slate-300">Click through each step to learn more</p>
        </div>
        <InteractiveSteps />
      </section>

      {/* Pricing Cards */}
      <section id="pricing-section" className="relative py-12 px-6">
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
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 via-red-500 to-pink-500 rounded-full shadow-lg animate-pulse">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-white/70">one-time</span>
                  </div>
                  <p className="text-emerald-300 font-semibold mt-2">✨ {plan.duration} of access</p>
                  {plan.limitedOffer && (
                    <p className="text-red-300 font-bold mt-2 text-sm animate-pulse">
                      ⏰ {plan.limitedOffer}
                    </p>
                  )}
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
                title: '4 Verification Modes',
                desc: 'Check if content is Real, True, a Scam, or Safe - all in one powerful tool.'
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
            className="relative rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&q=80"
              alt="Senior couple confidently using mobile device"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-900/80 to-blue-900/40 flex items-center">
              <div className="px-8 md:px-12 max-w-xl">
                <h4 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  🛡️ Browse with Confidence
                </h4>
                <p className="text-blue-100 text-lg">
                  No more second-guessing what's real. They'll feel secure knowing they can verify anything in seconds.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Countdown Banner */}
      <CountdownBanner />

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
          <p>© 2026 IsThis.io • The gift that keeps them safe online</p>
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