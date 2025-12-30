import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-slate-600">Last Updated: December 30, 2025</p>
          <p className="text-lg text-slate-700 mt-4">
            Your privacy matters to us. This policy explains what we collect, why we collect it, 
            and how we protect it.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-soft p-8 sm:p-12 space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
            <p className="text-slate-700 mb-4">
              We collect only what is necessary to operate and improve the Service.
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-slate-700 font-semibold mb-2">Information you may provide:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Email address (for accounts, support, or billing)</li>
                  <li>Content submitted for assessment</li>
                  <li>Optional context information (e.g., content type, industry)</li>
                </ul>
              </div>
              <div>
                <p className="text-slate-700 font-semibold mb-2">Automatically collected information:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Basic usage data (pages visited, feature use)</li>
                  <li>Device and browser information</li>
                  <li>Log data for security and reliability</li>
                </ul>
              </div>
              <p className="text-slate-700 font-medium">We do not collect unnecessary personal data.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Information</h2>
            <p className="text-slate-700 mb-4">We use information to:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>Provide assessments and reports</li>
              <li>Improve accuracy, usability, and performance</li>
              <li>Maintain security and prevent abuse</li>
              <li>Communicate with users when necessary</li>
            </ul>
            <p className="text-slate-700 font-medium">We do not sell your personal data.</p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Content Handling & Storage</h2>
            <div className="space-y-4">
              <div>
                <p className="text-slate-700 font-semibold mb-2">Default behavior:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Submitted content is hashed and not stored in readable form</li>
                </ul>
              </div>
              <div>
                <p className="text-slate-700 font-semibold mb-2">Optional behavior (opt-in):</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Encrypted storage to support features like history, batch analysis, and report generation</li>
                </ul>
              </div>
              <p className="text-slate-700">
                You control whether content is stored and may request deletion where applicable.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Analytics & Improvements</h2>
            <p className="text-slate-700 mb-4">
              We may analyze anonymized, aggregated data to improve the Service.
              This data cannot be used to identify individual users or specific content.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Sharing of Information</h2>
            <p className="text-slate-700 mb-4">We do not share personal data except:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
              <li>With trusted service providers who support core operations</li>
              <li>When legally required</li>
              <li>To protect the rights, safety, or integrity of the Service</li>
            </ul>
            <p className="text-slate-700">
              Service providers are bound by confidentiality and data protection obligations.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Security</h2>
            <p className="text-slate-700 mb-4">
              We use reasonable administrative, technical, and organizational safeguards to protect information.
            </p>
            <p className="text-slate-700">
              No system is perfectly secure, but we design IsThis.io with privacy and security as core principles.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Your Choices</h2>
            <p className="text-slate-700 mb-4">You may:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Access or update your account information</li>
              <li>Opt out of optional data storage</li>
              <li>Request deletion of stored content</li>
              <li>Contact us with privacy questions</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Children's Privacy</h2>
            <p className="text-slate-700 mb-4">
              IsThis.io is not directed at children under 13.
              We do not knowingly collect personal data from children.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Changes to This Policy</h2>
            <p className="text-slate-700">
              We may update this Privacy Policy as the Service evolves.
              Material changes will be communicated appropriately.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact Us</h2>
            <p className="text-slate-700 mb-2">Privacy questions or requests?</p>
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
            to={createPageUrl('TermsOfService')}
            className="hover:text-slate-900 transition-colors"
          >
            View Terms of Service →
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