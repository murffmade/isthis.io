import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from './useCurrentUser';

export function useEntitlement() {
  const { user, isAuthenticated } = useCurrentUser();

  const { data: entitlement, isLoading, refetch } = useQuery({
    queryKey: ['entitlement', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
        user_email: user.email
      });
      
      return entitlements.length > 0 ? entitlements[0] : null;
    },
    enabled: isAuthenticated && !!user?.email,
    staleTime: 1000 * 60, // 1 minute
  });

  const hasActivePlan = entitlement?.status === 'active';
  const isPending = entitlement?.status === 'pending';
  const isPastDue = entitlement?.status === 'past_due';

  return {
    entitlement,
    isLoading,
    hasActivePlan,
    isPending,
    isPastDue,
    refetch
  };
}