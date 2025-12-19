import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Ticket, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import ChatWidget from '@/components/support/ChatWidget';

export default function Support() {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium',
    email: ''
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create(data),
    onSuccess: () => {
      toast.success('Support ticket created! We\'ll get back to you soon.');
      setFormData({
        subject: '',
        description: '',
        category: 'other',
        priority: 'medium',
        email: ''
      });
      setShowTicketForm(false);
    },
    onError: () => {
      toast.error('Failed to create ticket. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
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
                <p className="text-xs text-slate-500">Support Center</p>
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
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How can we help you?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Get instant answers from our AI assistant or create a support ticket for personalized help
            </p>
          </motion.div>

          {/* Support Options */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-slate-900 transition-colors"
            >
              <MessageSquare className="w-12 h-12 text-slate-900 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Chat with AI Assistant</h3>
              <p className="text-slate-600 mb-6">
                Get instant answers to common questions about features, pricing, and how to use the platform
              </p>
              <p className="text-sm text-slate-500 italic mb-4">
                Note: This is an AI assistant. For complex issues, we recommend creating a support ticket.
              </p>
              <Button className="bg-slate-900 hover:bg-slate-800">
                Start Chat (See bottom right)
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-slate-900 transition-colors"
            >
              <Ticket className="w-12 h-12 text-slate-900 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Create Support Ticket</h3>
              <p className="text-slate-600 mb-6">
                Submit a detailed ticket for technical issues, billing questions, or feature requests
              </p>
              <p className="text-sm text-slate-500 italic mb-4">
                Our team typically responds within 24 hours
              </p>
              <Button
                onClick={() => setShowTicketForm(true)}
                variant="outline"
                className="border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
              >
                Create Ticket
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ticket Form */}
      {showTicketForm && (
        <section className="py-8 px-6 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Create Support Ticket</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Your Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    required
                    className="mt-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="bug_report">Bug Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please provide as much detail as possible..."
                    required
                    className="mt-2 h-32"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTicketForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="flex-1 bg-slate-900 hover:bg-slate-800"
                  >
                    {createTicketMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              {
                q: 'How accurate is the AI verification?',
                a: 'Our AI analyzes multiple signals including visual artifacts, metadata, and patterns. While highly accurate, no system is perfect, which is why we provide confidence scores and detailed explanations.'
              },
              {
                q: 'What file formats are supported?',
                a: 'We support common image formats (JPG, PNG, WebP) and video formats (MP4, MOV). You can also verify content by pasting URLs from social media platforms.'
              },
              {
                q: 'How does billing work for premium plans?',
                a: 'Premium plans are one-time payments. The annual plan ($29) gives you 1 year of full access, while the lifetime plan ($99) provides permanent access with all future updates.'
              },
              {
                q: 'Can I cancel my subscription?',
                a: 'Our plans are one-time purchases, not subscriptions. You have full access for the duration you paid for with no recurring charges.'
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 p-6"
              >
                <h4 className="font-semibold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-slate-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget onCreateTicket={() => setShowTicketForm(true)} />
    </div>
  );
}