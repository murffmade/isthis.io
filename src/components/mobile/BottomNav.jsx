import React from 'react';
import { Home, Search, History, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BottomNav({ currentPage = 'home' }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', page: 'Home' },
    { id: 'history', icon: History, label: 'History', page: 'History' },
    { id: 'account', icon: User, label: 'Account', page: 'Account' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom md:hidden z-50">
      <div className="grid grid-cols-3 h-16">
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
      </div>
    </nav>
  );
}