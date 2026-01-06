
import { createClient } from '@base44/sdk';

// Get appId from environment variable
const appId = import.meta.env.VITE_BASE44_APP_ID;

if (!appId) {
  console.error('VITE_BASE44_APP_ID environment variable is not set');
}

export const base44Auth = createClient({
  appId: appId || 'default-app-id',
  requiresAuth: true
});
