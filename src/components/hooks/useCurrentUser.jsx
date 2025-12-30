import { useQuery } from '@tanstack/react-query';
import { base44Auth } from '@/components/api/base44ClientAuth';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['authUser'],
    queryFn: () => base44Auth.auth.me(),
    retry: false,
    staleTime: 30000
  });
}