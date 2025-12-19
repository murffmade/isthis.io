import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, TrendingUp, Globe, Code, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';

export default function Enterprise() {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleContactSales = async (e) => {
    e.preventDefault();
    // In production, this would call an API to contact sales
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Is This Real?</h1>
                <p className="text-xs text-slate-500">Enterprise Solutions</p>
              </div>
            </a>
            <a
              href={createPageUrl('Home')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm mb-6">
              <Lock className="w-4 h-4" />
              Enterprise-Grade Verification
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Integrate AI Verification<br />Into Your Platform
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Enterprise API access, white-label solutions, and dedicated support for organizations 
              that need scalable AI content verification at their fingertips.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })}
                className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white text-lg"
              >
                Contact Sales
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                onClick={() => window.location.href = createPageUrl('APIDocs')}
                variant="outline"
                className="h-14 px-8 text-lg"
              >
                View API Docs
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* API Showcase */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-4">
                RESTful API for Seamless Integration
              </h3>
              <p className="text-slate-300 mb-6 text-lg">
                Submit images, videos, or URLs for analysis and receive structured JSON responses 
                with confidence scores, detected signals, and actionable insights.
              </p>
              <ul className="space-y-3">
                {[
                  'Real-time content verification',
                  'Batch processing support',
                  'Webhook notifications',
                  'Detailed analytics dashboard',
                  '99.9% uptime SLA'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <pre className="text-sm text-slate-300 overflow-x-auto">
{`// Example API Call
const response = await fetch(
  'https://api.isthisreal.com/v1/analyze',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://example.com/image.jpg',
      type: 'image'
    })
  }
);

const result = await response.json();
// {
//   "result": "likely_ai",
//   "confidence": 87,
//   "signals": [...],
//   "summary": "..."
// }`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Enterprise Features</h3>
            <p className="text-lg text-slate-600">Everything you need to build trust at scale</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Code,
                title: 'Developer-Friendly API',
                description: 'RESTful API with comprehensive documentation, SDKs for popular languages, and sandbox environment for testing.'
              },
              {
                icon: Zap,
                title: 'High-Performance Processing',
                description: 'Sub-second analysis times with scalable infrastructure that handles millions of requests per day.'
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                description: 'SOC 2 Type II compliant, end-to-end encryption, and private cloud deployment options available.'
              },
              {
                icon: Globe,
                title: 'Global CDN',
                description: 'Edge computing for ultra-low latency worldwide. Process content closer to your users.'
              },
              {
                icon: TrendingUp,
                title: 'Usage Analytics',
                description: 'Real-time dashboards showing API usage, detection patterns, and performance metrics.'
              },
              {
                icon: Shield,
                title: 'White-Label Solutions',
                description: 'Custom branding, dedicated domains, and seamless integration into your existing platform.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-8 border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-slate-900 mb-4" />
                <h4 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Built for Your Industry</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'News & Media',
                description: 'Verify user-submitted content before publication'
              },
              {
                title: 'Social Platforms',
                description: 'Automatic detection of synthetic media at scale'
              },
              {
                title: 'E-Commerce',
                description: 'Verify product images and prevent fraud'
              },
              {
                title: 'Law Enforcement',
                description: 'Forensic analysis and evidence verification'
              }
            ].map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <h4 className="font-semibold text-slate-900 mb-2">{useCase.title}</h4>
                <p className="text-sm text-slate-600">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Flexible Pricing</h3>
            <p className="text-lg text-slate-600">Custom plans tailored to your needs</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-900 p-8 md:p-12 text-center">
            <h4 className="text-2xl font-bold text-slate-900 mb-4">Enterprise Plan</h4>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Volume-based pricing starting at $999/month. Includes API access, dedicated support, 
              SLA guarantees, and custom integration assistance.
            </p>
            <ul className="grid md:grid-cols-2 gap-4 text-left mb-8 max-w-xl mx-auto">
              {[
                'Unlimited API requests',
                'Priority processing',
                'Custom rate limits',
                'Dedicated account manager',
                'Custom model training',
                'White-label options'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-slate-900 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button 
              onClick={() => document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })}
              className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 px-6 bg-slate-900">
        <div className="max-w-2xl mx-auto">
          {!submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">Get Started Today</h3>
                <p className="text-slate-300">Fill out the form and our team will contact you within 24 hours</p>
              </div>

              <form onSubmit={handleContactSales} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Company Name"
                    required
                    className="h-12 bg-white"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Work Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-white"
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    className="h-12 bg-white"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Expected Monthly Volume"
                    className="h-12 bg-white"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100"
                >
                  Contact Sales
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
              <p className="text-slate-300">Our sales team will contact you within 24 hours.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
          <p>© 2024 Is This Real? • Enterprise Solutions</p>
        </div>
      </footer>
    </div>
  );
}