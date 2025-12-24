import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { User, Settings, History, CreditCard, ChevronDown, Gift, LogOut } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfileDropdown({ onOpenSettings }) {
  const handleSignOut = () => {
    base44.auth.logout();
  };

  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Profile</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('Account')} className="flex items-center gap-2 cursor-pointer">
            <CreditCard className="w-4 h-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenSettings} className="flex items-center gap-2 cursor-pointer">
          <Settings className="w-4 h-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('MyGifts')} className="flex items-center gap-2 cursor-pointer">
            <Gift className="w-4 h-4" />
            My Gifts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('History')} className="flex items-center gap-2 cursor-pointer">
            <History className="w-4 h-4" />
            History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}