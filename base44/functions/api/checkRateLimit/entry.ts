import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export async function checkRateLimit(base44, apiKeyRecord) {
  const now = Date.now();
  const windowStart = now - (60 * 1000); // 1 minute window
  
  // Get recent usage
  const recentUsage = await base44.asServiceRole.entities.APIKey.filter({
    id: apiKeyRecord.id
  });
  
  if (!recentUsage || recentUsage.length === 0) {
    return { allowed: true, limit: 60, remaining: 60, reset: now + 60000 };
  }
  
  const key = recentUsage[0];
  const lastUsed = key.last_used ? new Date(key.last_used).getTime() : 0;
  
  // Simple rate limit: 60 requests per minute
  const limit = 60;
  const usageCount = key.usage_count || 0;
  const minutesSinceLastUse = (now - lastUsed) / (60 * 1000);
  
  // Reset counter if more than 1 minute has passed
  if (minutesSinceLastUse >= 1) {
    return { allowed: true, limit, remaining: limit - 1, reset: now + 60000 };
  }
  
  // Check if within limit
  const remaining = limit - (usageCount % limit);
  const allowed = remaining > 0;
  
  return {
    allowed,
    limit,
    remaining: Math.max(0, remaining - 1),
    reset: now + ((1 - minutesSinceLastUse) * 60000)
  };
}

Deno.serve(async (req) => {
  return Response.json({ 
    message: 'Rate limit helper function. Use via import.' 
  });
});