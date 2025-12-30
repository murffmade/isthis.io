import { createClient } from '@base44/sdk';

export const base44Public = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID,
  requiresAuth: false
});