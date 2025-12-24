import React from 'react';

export default function AppIcon({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <img 
      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69486b8731bdcb11526f9bc0/3e71a09e3_IMG_1935.png"
      alt="IsThis.io Logo"
      className={`${sizes[size]} rounded-xl ${className}`}
    />
  );
}