import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has enterprise subscription
    const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({ 
      user_email: user.email 
    });
    
    const hasEnterprise = entitlements.some(e => 
      e.status === 'active' && (e.plan_key === 'lifetime' || e.plan_key === 'annual')
    );

    if (!hasEnterprise) {
      return Response.json({ 
        error: 'Enterprise subscription required',
        message: 'API key generation requires an active Premium subscription'
      }, { status: 403 });
    }

    const { key_name } = await req.json();

    if (!key_name) {
      return Response.json({ error: 'key_name is required' }, { status: 400 });
    }

    // Check if user already has 10+ keys
    const existingKeys = await base44.entities.APIKey.filter({ created_by: user.email });
    
    if (existingKeys.length >= 10) {
      return Response.json({ 
        error: 'Maximum API keys reached',
        message: 'You can have a maximum of 10 API keys. Delete unused keys to create new ones.'
      }, { status: 400 });
    }

    // Generate secure API key
    const prefix = 'isthis_';
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const apiKey = prefix + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create API key record
    const keyRecord = await base44.entities.APIKey.create({
      key_name,
      api_key: apiKey,
      usage_count: 0,
      is_active: true
    });

    return Response.json({
      success: true,
      api_key: apiKey,
      key_id: keyRecord.id,
      key_name,
      message: 'API key created successfully. Save this key securely - it will not be shown again.',
      warning: 'Keep your API key secret. Anyone with this key can make requests on your behalf.'
    });

  } catch (error) {
    console.error('Generate API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});