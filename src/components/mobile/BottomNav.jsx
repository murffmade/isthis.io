import React, { useState, useEffect } from 'react';
import { Home, History, Gift, MoreHorizontal, User, Settings, LogOut, BookOpen, Briefcase, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function BottomNav({ currentPage = 'home' }) {
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (showMore) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMore]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', page: 'Home' },
    { id: 'history', icon: History, label: 'History', page: 'History' },
    { id: 'gifts', icon: Gift, label: 'Gifts', page: 'MyGifts' }
  ];

  const moreItems = [
    { icon: User, label: 'Account', page: 'Account' },
    { icon: BookOpen, label: 'Learn', page: 'Learn' },
    { icon: Briefcase, label: 'Enterprise', page: 'EnterpriseMarketing' },
    { icon: Mail, label: 'Support', page: 'Support' },
    { icon: Settings, label: 'Settings', action: 'settings' }
  ];

  const handleMoreItemClick = (item) => {
    if (item.action === 'settings') {
      // Settings action could be handled by parent
      setShowMore(false);
    } else if (item.action === 'logout') {
      base44.auth.logout();
    } else {
      setShowMore(false);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom md:hidden z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Link
                key={item.id}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                  isActive 
                    ? 'text-slate-900' 
                    : 'text-slate-400 active:text-slate-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-slate-900' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
              showMore ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-40 md:hidden safe-bottom max-h-[80vh] flex flex-col"
            >
              <div className="p-6 pb-8 overflow-y-auto flex-1">
                <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-bold text-slate-900 mb-4">More Options</h3>
                <div className="space-y-2">
                  {moreItems.map((item, i) => {
                    const Icon = item.icon;
                    if (item.page) {
                      return (
                        <Link
                          key={i}
                          to={createPageUrl(item.page)}
                          onClick={() => handleMoreItemClick(item)}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium text-slate-900">{item.label}</span>
                        </Link>
                      );
                    } else {
                      return (
                        <button
                          key={i}
                          onClick={() => handleMoreItemClick(item)}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors w-full text-left"
                        >
                          <Icon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium text-slate-900">{item.label}</span>
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}