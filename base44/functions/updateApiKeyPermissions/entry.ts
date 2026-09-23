import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_id, permissions, rate_limit } = await req.json();

    if (!key_id) {
      return Response.json({ error: 'Key ID required' }, { status: 400 });
    }

    // Fetch the key
    const keys = await base44.entities.APIKey.filter({ id: key_id, created_by: user.email });
    
    if (!keys || keys.length === 0) {
      return Response.json({ error: 'API key not found' }, { status: 404 });
    }

    // Update permissions
    const updates = {};
    if (permissions) updates.permissions = permissions;
    if (rate_limit) updates.rate_limit = rate_limit;

    await base44.entities.APIKey.update(key_id, updates);

    return Response.json({
      success: true,
      message: 'API key permissions updated'
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});