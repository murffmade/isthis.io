import React from 'react';
import { Toaster } from 'sonner';
import { createPageUrl } from '@/utils';

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
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
                      <a href={createPageUrl('APIDocs')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        API Docs
                      </a>
                    </li>
                    <li>
                      <a href={createPageUrl('Enterprise')} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Enterprise
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
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}