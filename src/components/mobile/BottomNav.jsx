import React, { useState, useEffect } from 'react';
import { Home, History, Gift, MoreHorizontal, User, Settings, LogOut, BookOpen, Briefcase, Mail, BookText, Users as UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function BottomNav({ currentPage = 'home' }) {
  const [showMore, setShowMore] = useState(false);

  // Fetch user's subscription to check premium status
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: userSubscription } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      if (!currentUser) return null;
      const subs = await base44.entities.Subscription.filter({ created_by: currentUser.email });
      return subs[0] || null;
    },
    enabled: !!currentUser
  });

  const isPremium = userSubscription && 
    (userSubscription.plan === 'annual' || userSubscription.plan === 'lifetime') && 
    userSubscription.status === 'active';

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
    { id: 'learn', icon: BookOpen, label: 'Learn', page: 'Learn' },
    { id: 'history', icon: History, label: 'History', page: 'History', premium: true },
    { id: 'account', icon: User, label: 'Account', page: 'Account' }
  ];

  const moreItems = [
    { icon: Gift, label: 'Gifts', page: 'MyGifts' },
    { icon: BookText, label: 'Blog', page: 'Blog' },
    { icon: UsersIcon, label: 'Referrals', page: 'AffiliateMarketing' },
    { icon: Mail, label: 'Support', page: 'Support' }
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
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 safe-bottom md:hidden z-50 shadow-lg">
          <div className="grid grid-cols-5 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isLocked = item.premium && !isPremium;

              return (
                <Link
                  key={item.id}
                  to={createPageUrl(item.page)}
                  className={`relative flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                    isActive 
                      ? 'text-[#3498DB]' 
                      : 'text-slate-400 active:text-slate-600'
                  }`}
                >
                  <Icon className={`w-6 h-6`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isLocked && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">★</span>
                    </div>
                  )}
                </Link>
              );
            })}

            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                showMore ? 'text-[#3498DB]' : 'text-slate-400'
              }`}
            >
              <MoreHorizontal className={`w-6 h-6`} />
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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-40 md:hidden safe-bottom max-h-[85vh] flex flex-col"
              >
              <div className="p-4 pb-6 overflow-y-auto flex-1">
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
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 active:bg-slate-100 active:scale-95 transition-all"
                        >
                          <Icon className="w-5 h-5 text-[#2C3E50]" />
                          <span className="font-medium text-slate-900">{item.label}</span>
                        </Link>
                      );
                    } else {
                      return (
                        <button
                          key={i}
                          onClick={() => handleMoreItemClick(item)}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 active:bg-slate-100 active:scale-95 transition-all w-full text-left"
                        >
                          <Icon className="w-5 h-5 text-[#2C3E50]" />
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