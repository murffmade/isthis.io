import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, Zap, CheckCircle2, Link as LinkIcon, BarChart3, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AffiliateMarketing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <DollarSign className="w-4 h-4" />
              Earn 30% Recurring Commission
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Partner With IsThis.io
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Help people detect AI content and earn 30% commission on every sale you refer, forever.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('AffiliateDashboard')}>
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 h-14 px-8 text-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Become an Affiliate
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-14 px-8 text-lg">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: DollarSign, value: '30%', label: 'Commission Rate' },
              { icon: Users, value: '10K+', label: 'Active Users' },
              { icon: TrendingUp, value: '95%', label: 'Conversion Rate' },
              { icon: Gift, value: '$29-$99', label: 'Product Range' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Partner With Us?</h2>
            <p className="text-xl text-slate-600">Join a program that rewards you for spreading AI awareness</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: 'Recurring 30% Commission',
                description: 'Earn 30% on every annual subscription renewal, not just the first sale.'
              },
              {
                icon: Zap,
                title: 'Easy to Promote',
                description: 'High-quality product that sells itself. People need AI detection now.'
              },
              {
                icon: LinkIcon,
                title: 'Simple Tracking',
                description: 'Get your unique link, share it, and track conversions in real-time.'
              },
              {
                icon: Users,
                title: 'Growing Market',
                description: 'AI content is everywhere. Everyone needs verification tools.'
              },
              {
                icon: TrendingUp,
                title: 'High Conversion',
                description: 'Free tier hooks users, premium converts at 95%+ rate.'
              },
              {
                icon: BarChart3,
                title: 'Real-Time Dashboard',
                description: 'Track clicks, conversions, and earnings with detailed analytics.'
              }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Start earning in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your affiliate account and get your unique tracking link instantly.'
              },
              {
                step: '2',
                title: 'Share Your Link',
                description: 'Share on social media, blog, newsletter, or anywhere your audience hangs out.'
              },
              {
                step: '3',
                title: 'Earn Commission',
                description: 'Get paid 30% for every sale. Track everything in your dashboard.'
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl border-2 border-indigo-200 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 text-white text-2xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-indigo-300 text-3xl">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Earnings Breakdown</h2>
            <p className="text-xl text-slate-600">See exactly how much you can earn</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-indigo-200 p-8">
              <div className="text-sm font-semibold text-indigo-600 mb-2">Annual Plan</div>
              <div className="text-4xl font-bold text-slate-900 mb-4">$8.70</div>
              <div className="text-slate-600 mb-4">per customer per year</div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                30% of $29 annual subscription
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8">
              <div className="text-sm font-semibold text-purple-600 mb-2">Lifetime Plan</div>
              <div className="text-4xl font-bold text-slate-900 mb-4">$29.70</div>
              <div className="text-slate-600 mb-4">one-time per customer</div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                30% of $99 lifetime purchase
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-emerald-900 mb-1">Example: 100 referrals</div>
                <div className="text-sm text-emerald-800">
                  If 70 choose annual ($8.70 × 70 = $609/year) and 30 choose lifetime ($29.70 × 30 = $891), 
                  you'd earn <span className="font-bold">$1,500+ in your first year!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join our affiliate program today and start earning 30% commission on every sale you refer.
          </p>
          
          <Link to={createPageUrl('AffiliateDashboard')}>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 h-16 px-12 text-lg">
              <Zap className="w-5 h-5 mr-2" />
              Get Your Affiliate Link
            </Button>
          </Link>

          <p className="text-sm text-white/70 mt-6">
            No approval needed • Start promoting immediately
          </p>
        </div>
      </section>
    </div>
  );
}