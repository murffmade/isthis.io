import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44Auth } from '@/api/base44ClientAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        return await base44Auth.auth.me();
      } catch (err) {
        throw err;
      }
    },
    retry: false,
    staleTime: 30000
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    const currentPath = window.location.pathname + window.location.search;
    base44Auth.auth.redirectToLogin(currentPath);
    return null;
  }

  return <>{children}</>;
}