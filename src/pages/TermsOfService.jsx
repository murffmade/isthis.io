import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back Button */}
        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3498DB] to-[#2C3E50] flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Terms of Service</h1>
          </div>
          <p className="text-slate-600">Last Updated: December 30, 2025</p>
          <p className="text-lg text-slate-700 mt-4">Welcome to IsThis.io. We're glad you're here.</p>
          <p className="text-slate-600 mt-2">
            By accessing or using IsThis.io (the "Service"), you agree to these Terms of Service ("Terms"). 
            If you do not agree, please do not use the Service.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-soft p-8 sm:p-12 space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What Is IsThis.io?</h2>
            <p className="text-slate-700 mb-4">
              IsThis.io provides likelihood-based assessments designed to help users understand whether 
              digital content may have been generated or influenced by artificial intelligence.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-slate-700 font-semibold">Our Service:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Provides probabilistic assessments, not definitive answers</li>
                <li>Is intended for decision support and educational purposes</li>
                <li>Does not verify authenticity, authorship, or factual accuracy</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. What IsThis.io Is Not</h2>
            <p className="text-slate-700 mb-4">To be clear and transparent:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>IsThis.io is not a lie detector</li>
              <li>IsThis.io does not guarantee correctness</li>
              <li>IsThis.io does not provide legal, academic, or professional certification</li>
              <li>Results should not be treated as proof or evidence on their own</li>
            </ul>
            <p className="text-slate-700 mt-4 font-medium">
              You are responsible for how you interpret and use the results.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Responsibilities</h2>
            <p className="text-slate-700 mb-4">By using the Service, you agree that you will:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Use IsThis.io responsibly and in good faith</li>
              <li>Not rely on results as the sole basis for high-stakes decisions</li>
              <li>Not represent IsThis.io results as definitive or conclusive</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
            <p className="text-slate-700 mb-2">You may not:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Attempt to reverse-engineer or exploit the Service</li>
              <li>Use the Service to harass, mislead, or deceive others</li>
              <li>Use the Service for unlawful purposes</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Content You Submit</h2>
            <p className="text-slate-700 mb-4">You retain ownership of any content you submit.</p>
            <p className="text-slate-700 mb-4">
              By submitting content, you grant IsThis.io a limited license to process it solely for 
              the purpose of providing the assessment and related features.
            </p>
            <p className="text-slate-700 font-medium">We do not claim ownership of your content.</p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Storage Choices</h2>
            <div className="space-y-4">
              <div>
                <p className="text-slate-700 font-semibold mb-2">By default:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Submitted content is hashed and not stored in readable form</li>
                </ul>
              </div>
              <div>
                <p className="text-slate-700 font-semibold mb-2">If you opt in:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Content may be securely stored in encrypted form to support features like history, reports, or rescoring</li>
                </ul>
              </div>
              <p className="text-slate-700">You may delete stored content at any time where applicable.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Service Availability</h2>
            <p className="text-slate-700 mb-4">
              We strive to keep IsThis.io reliable, but we do not guarantee uninterrupted availability 
              or error-free operation.
            </p>
            <p className="text-slate-700">
              Features may change, improve, or be discontinued as the Service evolves.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-slate-700 mb-4">To the fullest extent permitted by law:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>IsThis.io is provided "as is"</li>
              <li>We are not liable for decisions, actions, or outcomes based on Service results</li>
              <li>We are not responsible for indirect, incidental, or consequential damages</li>
            </ul>
            <p className="text-slate-700 font-medium">
              Your use of the Service is at your own discretion and risk.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Termination</h2>
            <p className="text-slate-700">
              We reserve the right to suspend or terminate access for violations of these Terms or 
              misuse of the Service.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Changes to These Terms</h2>
            <p className="text-slate-700">
              We may update these Terms from time to time. Continued use of the Service means you 
              accept the updated Terms.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact</h2>
            <p className="text-slate-700 mb-2">Questions about these Terms?</p>
            <Link
              to={createPageUrl('Contact')}
              className="text-[#3498DB] hover:text-[#2980b9] font-medium inline-flex items-center gap-1"
            >
              Contact us
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <Link
            to={createPageUrl('PrivacyPolicy')}
            className="hover:text-slate-900 transition-colors"
          >
            View Privacy Policy →
          </Link>
          <Link
            to={createPageUrl('Home')}
            className="hover:text-slate-900 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}