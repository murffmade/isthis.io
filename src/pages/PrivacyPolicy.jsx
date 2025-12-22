import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PrivacyPolicy() {
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
                <p className="text-xs text-slate-500">Privacy Policy</p>
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
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h2>
          <p className="text-slate-600 mb-8">Last Updated: December 22, 2025</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">1. Information We Collect</h3>
              <p className="text-slate-600 leading-relaxed">
                We collect information you provide directly to us, including your name, email address, and payment information when you create an account or purchase a subscription. We also collect content you upload for verification purposes.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h3>
              <p className="text-slate-600 leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">3. Data Storage and Retention</h3>
              <p className="text-slate-600 leading-relaxed">
                By default, we do not store your uploaded content unless you explicitly enable history saving in your preferences. When history is enabled, content is stored securely and encrypted. You can delete your history at any time.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">4. Stripe Payment Processing</h3>
              <p className="text-slate-600 leading-relaxed">
                We use Stripe for payment processing. Your payment information is transmitted directly to Stripe and is never stored on our servers. Stripe is PCI-DSS compliant and handles all payment data securely. For more information, see <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe's Privacy Policy</a>.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">5. Sharing of Information</h3>
              <p className="text-slate-600 leading-relaxed">
                We do not sell, rent, or share your personal information with third parties except as described in this policy. We may share information with service providers who assist us in operating our platform (e.g., Stripe for payments, cloud hosting providers).
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">6. Your Rights</h3>
              <p className="text-slate-600 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data (right to be forgotten)</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">7. GDPR Compliance</h3>
              <p className="text-slate-600 leading-relaxed">
                We comply with the EU General Data Protection Regulation (GDPR). If you are located in the European Economic Area, you have specific rights regarding your personal data. Contact us to exercise these rights.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">8. Cookies and Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                We use essential cookies to maintain your session and provide core functionality. We do not use tracking or advertising cookies.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">9. Security</h3>
              <p className="text-slate-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">10. Contact Us</h3>
              <p className="text-slate-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@isthis.io" className="text-blue-600 hover:underline">privacy@isthis.io</a>
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}