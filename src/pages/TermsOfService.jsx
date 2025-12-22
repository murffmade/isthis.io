import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
                <p className="text-xs text-slate-500">Terms of Service</p>
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

      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h2>
          <p className="text-slate-600 mb-8">Last Updated: December 22, 2025</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h3>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using IsThis.io, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our service.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">2. Description of Service</h3>
              <p className="text-slate-600 leading-relaxed">
                IsThis.io provides AI-powered content verification services to help users determine if images, videos, and other content are authentic or AI-generated. Our service includes free and premium tiers with varying features and usage limits.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">3. Use of Service</h3>
              <p className="text-slate-600 leading-relaxed mb-3">You agree to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Use the service only for lawful purposes</li>
                <li>Not attempt to interfere with or disrupt the service</li>
                <li>Not use automated tools to access the service without permission</li>
                <li>Not misrepresent yourself or your affiliation</li>
                <li>Not upload illegal, harmful, or infringing content</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">4. Payment Terms</h3>
              <p className="text-slate-600 leading-relaxed">
                Premium plans are offered as one-time payments, not subscriptions. Once purchased, you receive access for the specified duration (1 year or lifetime). All payments are processed securely through Stripe. Prices are displayed in USD and may be subject to applicable taxes.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">5. Refund Policy</h3>
              <p className="text-slate-600 leading-relaxed">
                We offer a 14-day money-back guarantee for premium plans. If you are not satisfied with the service, contact us within 14 days of purchase for a full refund. Refunds are not available after 14 days or if the account has been used extensively.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">6. Accuracy Disclaimer</h3>
              <p className="text-slate-600 leading-relaxed">
                While we strive for high accuracy, our AI verification service is not infallible. Results are provided as confidence scores and should not be considered absolute truth. We are not liable for decisions made based on our analysis.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">7. Intellectual Property</h3>
              <p className="text-slate-600 leading-relaxed">
                You retain all rights to content you upload. By uploading content, you grant us a limited license to analyze it and provide verification services. We do not claim ownership of your content.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">8. Termination</h3>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your access to premium features will be revoked, but you may request a refund if eligible under our refund policy.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">9. Limitation of Liability</h3>
              <p className="text-slate-600 leading-relaxed">
                IsThis.io is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">10. Changes to Terms</h3>
              <p className="text-slate-600 leading-relaxed">
                We may update these Terms of Service from time to time. We will notify users of significant changes via email or through the platform. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">11. Governing Law</h3>
              <p className="text-slate-600 leading-relaxed">
                These terms are governed by the laws of the jurisdiction where our company is registered. Any disputes will be resolved in accordance with those laws.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">12. Contact</h3>
              <p className="text-slate-600 leading-relaxed">
                For questions about these Terms of Service, contact us at: <a href="mailto:legal@isthis.io" className="text-blue-600 hover:underline">legal@isthis.io</a>
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}