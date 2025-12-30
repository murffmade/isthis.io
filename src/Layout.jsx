import React from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from 'sonner';
import { createPageUrl } from '@/utils';
import ScrollToTop from '@/components/shared/ScrollToTop';
import PushNotifications from '@/components/notifications/PushNotifications';
import DevConsoleOverlay from '@/components/devtools/DevConsoleOverlay';
import { base44 } from '@/api/base44Client';
import { base44Auth } from '@/components/api/base44ClientAuth';
import { useQuery } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const isAdmin = currentUser?.role === 'admin';

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
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'%3E%3C/path%3E%3C/svg%3E" />
        <meta name="theme-color" content="#0f172a" />
      </Helmet>
      <ScrollToTop />
      <PushNotifications />
      <DevConsoleOverlay />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --color-primary: 79 70 229;
          --color-secondary: 99 102 241;
          --radius: 1rem;
        }

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -0.01em;
        }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overscroll-behavior-y: none;
          background: #fafafa;
        }

        /* Modern gradients and effects */
        .gradient-mesh {
          background: 
            radial-gradient(at 40% 20%, rgba(52, 152, 219, 0.06) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(127, 140, 141, 0.04) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(52, 152, 219, 0.05) 0px, transparent 50%),
            linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .shadow-soft {
          box-shadow: 0 2px 24px -4px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.04);
        }

        .shadow-medium {
          box-shadow: 0 4px 32px -8px rgba(0, 0, 0, 0.08), 0 2px 12px -4px rgba(0, 0, 0, 0.05);
        }

        .button-shine {
          position: relative;
          overflow: hidden;
        }

        .button-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .button-shine:hover::before {
          left: 100%;
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
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white border-t border-slate-800">
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
                        Referrals
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

                {isAdmin && (
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Admin</h4>
                    <ul className="space-y-2">
                      <li>
                        <a href={createPageUrl('Admin')} className="text-sm text-slate-400 hover:text-white transition-colors">
                          Admin Panel
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
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