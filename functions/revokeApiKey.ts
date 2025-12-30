import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key_id } = await req.json();

    if (!key_id) {
      return Response.json({ error: 'key_id is required' }, { status: 400 });
    }

    // Verify ownership and delete
    const keys = await base44.entities.APIKey.filter({ 
      id: key_id,
      created_by: user.email 
    });

    if (keys.length === 0) {
      return Response.json({ error: 'API key not found' }, { status: 404 });
    }

    await base44.entities.APIKey.delete(key_id);

    return Response.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('Revoke API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});