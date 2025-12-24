import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, CheckCircle2, Briefcase, Zap, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BottomNav from '@/components/mobile/BottomNav';

export default function BusinessMarketing() {
  const [formData, setFormData] = useState({
    company: '',
    email: '',
    name: '',
    teamSize: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: 'business@isthis.io',
        subject: `Business Early Access: ${formData.company}`,
        body: `
New Business Inquiry

Company: ${formData.company}
Name: ${formData.name}
Email: ${formData.email}
Team Size: ${formData.teamSize}

Message:
${formData.message}
        `
      });

      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
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
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500">Business Solutions</p>
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
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm mb-6 font-medium">
              <Briefcase className="w-4 h-4" />
              Early Access Program
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              AI Verification for<br />Growing Businesses
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Empower your team with collaborative content verification, team management, 
              and advanced analytics. Perfect for entrepreneurs, startups, and small businesses.
            </p>
          </motion.div>

          {/* Coming Soon Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              {
                icon: '👥',
                title: 'Team Collaboration',
                desc: 'Invite team members, share analyses, and collaborate on verification decisions in real-time'
              },
              {
                icon: '📊',
                title: 'Advanced Analytics',
                desc: 'Track verification trends, monitor team usage, and gain insights with custom reports'
              },
              {
                icon: '⚡',
                title: 'Priority Support',
                desc: 'Get expert help when you need it with dedicated support channels and faster response times'
              },
              {
                icon: '🎯',
                title: 'Custom Workflows',
                desc: 'Build automated verification workflows tailored to your business processes'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white rounded-xl p-6 border-2 border-slate-200"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h4 className="font-semibold text-slate-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-12 mb-20">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">
              Built for Teams That Move Fast
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                'Unlimited verifications for your entire team',
                'Role-based access control and permissions',
                'Shared verification history across your organization',
                'Team performance metrics and reporting',
                'Integration with Slack, Teams, and other tools',
                'Custom branding options for reports'
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="bg-slate-50 rounded-2xl p-8 mb-20">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Flexible Plans for Every Business
            </h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  name: 'Starter',
                  price: '$49',
                  period: '/month',
                  users: 'Up to 5 users',
                  features: ['Unlimited verifications', 'Team collaboration', 'Basic analytics', 'Email support']
                },
                {
                  name: 'Growth',
                  price: '$149',
                  period: '/month',
                  users: 'Up to 20 users',
                  features: ['Everything in Starter', 'Advanced analytics', 'Priority support', 'Custom workflows'],
                  highlight: true
                },
                {
                  name: 'Scale',
                  price: 'Custom',
                  period: '',
                  users: 'Unlimited users',
                  features: ['Everything in Growth', 'API access', 'Dedicated support', 'Custom integrations']
                }
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-xl p-6 ${
                    plan.highlight 
                      ? 'border-2 border-indigo-600 shadow-lg' 
                      : 'border-2 border-slate-200'
                  }`}
                >
                  {plan.highlight && (
                    <div className="text-xs font-bold text-indigo-600 mb-2">MOST POPULAR</div>
                  )}
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{plan.users}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Early Access Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 border-slate-900 p-8 md:p-12"
          >
            {!submitted ? (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">
                    Join the Early Access Program
                  </h3>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Be among the first businesses to access our team collaboration features. 
                    Get special early adopter pricing and help shape the product.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company/Business Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Acme Startup"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Your Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Jane Doe"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Work Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="jane@startup.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Team Size *
                    </label>
                    <select
                      required
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full h-12 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select team size</option>
                      <option value="1-5">1-5 people</option>
                      <option value="6-20">6-20 people</option>
                      <option value="21-50">21-50 people</option>
                      <option value="50+">50+ people</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tell us about your use case
                    </label>
                    <Textarea
                      placeholder="How will your team use AI verification?"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    {submitting ? 'Submitting...' : 'Request Early Access'}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By submitting, you agree to be contacted about business solutions.
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h3>
                <p className="text-slate-600 mb-6">
                  We've received your request. Our team will contact you within 48 hours with early access details.
                </p>
                <Button
                  onClick={() => window.location.href = createPageUrl('Home')}
                  variant="outline"
                >
                  Return to Home
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}