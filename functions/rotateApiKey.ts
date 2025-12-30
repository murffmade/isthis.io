import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_id } = await req.json();

    if (!key_id) {
      return Response.json({ error: 'Key ID required' }, { status: 400 });
    }

    // Fetch the key to rotate
    const keys = await base44.entities.APIKey.filter({ id: key_id, created_by: user.email });
    
    if (!keys || keys.length === 0) {
      return Response.json({ error: 'API key not found' }, { status: 404 });
    }

    const oldKey = keys[0];

    // Generate new API key
    const newApiKey = `isthis_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyHash = crypto.createHash('sha256').update(newApiKey).digest('hex');

    // Update the existing key record
    await base44.entities.APIKey.update(key_id, {
      api_key: keyHash,
      last_rotated: new Date().toISOString()
    });

    return Response.json({
      success: true,
      key_id: key_id,
      api_key: newApiKey,
      message: 'API key rotated successfully. Save this new key securely.'
    });

  } catch (error) {
    console.error('Rotate API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});