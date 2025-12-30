
import { createClient } from '@base44/sdk';

const appId = import.meta.env.VITE_BASE44_APP_ID || 'default-app-id';

export const base44Auth = createClient({
  appId: appId,
  requiresAuth: true
});
