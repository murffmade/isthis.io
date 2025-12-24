import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpButton({ onStartTour }) {
  return (
    <Button
      onClick={() => {
        localStorage.removeItem('onboarding-completed');
        window.location.reload();
      }}
      variant="outline"
      size="sm"
      className="gap-2 hidden md:flex"
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">Show Tour</span>
    </Button>
  );
}