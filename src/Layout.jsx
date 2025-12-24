import React from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from 'sonner';
import { createPageUrl } from '@/utils';
import ScrollToTop from '@/components/shared/ScrollToTop';
import PushNotifications from '@/components/notifications/PushNotifications';

export default function Layout({ children, currentPageName }) {
  const footerLinks = [
    { label: 'About', path: 'About' },
    { label: 'Careers', path: 'Careers' },
    { label: 'Learn', path: 'Learn' },
    { label: 'Blog', path: 'Blog' },
    { label: 'Support', path: 'Support' },
    { label: 'Contact', path: 'Contact' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>IsThis.io - AI Content Verification</title>
        <meta name="description" content="Verify if images and videos are real or AI-generated with our free detection tool" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'%3E%3C/path%3E%3C/svg%3E" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="IsThis.io" />
      </Helmet>
      <ScrollToTop />
      <PushNotifications />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overscroll-behavior-y: none;
        }

        /* Modern gradients and effects */
        .gradient-mesh {
          background: 
            radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.1) 0px, transparent 50%);
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }
          
          input, textarea, select {
            font-size: 16px !important; /* Prevents zoom on focus iOS */
          }
        }
        
        /* Smooth momentum scrolling */
        .overflow-y-auto, .overflow-auto {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Safe area padding for notched devices */
        .safe-top {
          padding-top: env(safe-area-inset-top);
        }
        
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        .pb-safe {
          padding-bottom: calc(1rem + env(safe-area-inset-bottom));
        }
        
        /* Slide up animation for notifications */
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
          }
        }}
      />
      
      <main className="flex-1">
        {children}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-lg mb-2">IsThis.io</h3>
              <p className="text-sm text-slate-400">
                AI content verification for everyone
              </p>
            </div>

            {/* Links */}
            <div className="md:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Company</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href={createPageUrl('About')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        About
                      </a>
                    </li>
                    <li>
                      <a href={createPageUrl('Careers')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Careers
                      </a>
                    </li>
                    <li>
                      <a href={createPageUrl('Blog')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Blog
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-sm">Resources</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href={createPageUrl('Learn')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Learn
                      </a>
                    </li>
                    <li>
                      <a href={createPageUrl('EnterpriseMarketing')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Enterprise
                      </a>
                    </li>
                    <li>
                      <a href={createPageUrl('AffiliateMarketing')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Affiliate Program
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-sm">Support</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href={createPageUrl('Support')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Support Center
                      </a>
                    </li>
                    <li>
                      <a href={createPageUrl('Contact')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © 2026 IsThis.io All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href={createPageUrl('PrivacyPolicy')} className="text-sm text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href={createPageUrl('TermsOfService')} className="text-sm text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}