import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Settings, History, CreditCard, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfileDropdown({ onOpenSettings }) {
  return (
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
          <Link to={createPageUrl('History')} className="flex items-center gap-2 cursor-pointer">
            <History className="w-4 h-4" />
            History
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}