import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, CheckCircle2, Building2, Zap, Lock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EnterpriseMarketing() {
  const [formData, setFormData] = useState({
    company: '',
    email: '',
    name: '',
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
        to: 'enterprise@isthis.io',
        subject: `Enterprise Early Access: ${formData.company}`,
        body: `
New Enterprise Inquiry

Company: ${formData.company}
Name: ${formData.name}
Email: ${formData.email}

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
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
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
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm mb-6 font-medium">
              <Building2 className="w-4 h-4" />
              Early Access Program
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Enterprise-Grade<br />AI Verification
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Scale content verification across your organization with batch processing, 
              API access, and dedicated support. Join our early access program.
            </p>
          </motion.div>

          {/* Coming Soon Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              {
                icon: '📦',
                title: 'Batch Analysis',
                desc: 'Process up to 1,000 items simultaneously with progress tracking and automated reporting'
              },
              {
                icon: '🔌',
                title: 'API Access',
                desc: 'RESTful API with webhooks, SDKs, and comprehensive documentation for seamless integration'
              },
              {
                icon: '⚡',
                title: 'Priority Processing',
                desc: 'Dedicated infrastructure with guaranteed uptime and sub-second analysis times'
              },
              {
                icon: '🔐',
                title: 'Enterprise Security',
                desc: 'SOC 2 compliance, private deployments, and custom data retention policies'
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
          <div className="bg-slate-900 rounded-2xl p-12 mb-20">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">
              Built for Organizations That Need Scale
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                'Process millions of verifications per day',
                'White-label solutions with custom branding',
                'Dedicated account manager and priority support',
                'Custom integrations and workflow automation',
                'Advanced analytics and reporting dashboards',
                'Flexible deployment options (cloud or on-premise)'
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-200">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-slate-900 mb-8 text-center">
              Trusted by Industry Leaders
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  industry: 'News & Media',
                  use: 'Verify user-submitted content before publication and maintain editorial integrity'
                },
                {
                  industry: 'Social Platforms',
                  use: 'Automatically detect and flag synthetic media at scale across millions of posts'
                },
                {
                  industry: 'E-Commerce',
                  use: 'Prevent fraud with automated product image verification and seller monitoring'
                }
              ].map((useCase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-slate-200"
                >
                  <h4 className="font-semibold text-slate-900 mb-2 text-lg">{useCase.industry}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{useCase.use}</p>
                </motion.div>
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
                    Request Early Access
                  </h3>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Join leading organizations in our enterprise early access program. 
                    Our team will contact you within 24 hours to discuss your needs and provide a custom demo.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Acme Corp"
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
                      placeholder="John Smith"
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
                      placeholder="john@acmecorp.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tell us about your needs
                    </label>
                    <Textarea
                      placeholder="Expected volume, use case, timeline, etc."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {submitting ? 'Submitting...' : 'Request Early Access'}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By submitting, you agree to be contacted about enterprise solutions.
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h3>
                <p className="text-slate-600 mb-6">
                  We've received your request. Our enterprise team will contact you within 24 hours.
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
    </div>
  );
}