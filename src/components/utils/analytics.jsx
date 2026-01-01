import { base44 } from '@/api/base44Client';

// Get or create anonymous session ID
export function getSessionId() {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

// Privacy-respecting analytics tracking
export async function track(event_name, metadata = {}) {
  try {
    const sessionId = getSessionId();
    
    // Get user ID if authenticated (optional)
    let userId = null;
    try {
      const user = await base44.auth.me();
      userId = user?.id || null;
    } catch {
      // Not authenticated, continue with anonymous tracking
    }

    // Create event
    await base44.entities.AnalyticsEvent.create({
      session_id: sessionId,
      user_id: userId,
      event_name,
      page: window.location.pathname,
      metadata_json: metadata,
      app_version: '1.0.0',
      referrer: document.referrer || null
    });
  } catch (error) {
    // Fail silently - analytics should never break the app
    console.warn('Analytics tracking failed:', error);
  }
}

// Helper to bucket input length
export function getInputLengthBucket(length) {
  if (length <= 200) return '0-200';
  if (length <= 800) return '200-800';
  return '800+';
}

// Helper to bucket latency
export function getLatencyBucket(ms) {
  if (ms < 1000) return '0-1s';
  if (ms < 3000) return '1-3s';
  if (ms < 5000) return '3-5s';
  return '5s+';
}