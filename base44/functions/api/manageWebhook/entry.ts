import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check API key authentication
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keys = await base44.asServiceRole.entities.APIKey.filter({ api_key: keyHash, is_active: true });
    
    if (!keys || keys.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const apiKeyRecord = keys[0];
    const method = req.method;

    // GET - List webhooks
    if (method === 'GET') {
      const webhooks = await base44.asServiceRole.entities.WebhookEndpoint.filter({
        user_email: apiKeyRecord.created_by,
        api_key_id: apiKeyRecord.id
      });

      return Response.json({
        success: true,
        webhooks: webhooks.map(w => ({
          id: w.id,
          url: w.url,
          events: w.events,
          is_active: w.is_active,
          failure_count: w.failure_count,
          last_success: w.last_success,
          created_date: w.created_date
        }))
      });
    }

    // POST - Create webhook
    if (method === 'POST') {
      const { url, events } = await req.json();

      if (!url || !events || !Array.isArray(events)) {
        return Response.json({ error: 'URL and events array required' }, { status: 400 });
      }

      // Generate webhook secret
      const secret = crypto.randomUUID();

      const webhook = await base44.asServiceRole.entities.WebhookEndpoint.create({
        user_email: apiKeyRecord.created_by,
        api_key_id: apiKeyRecord.id,
        url,
        events,
        secret,
        is_active: true,
        failure_count: 0
      });

      return Response.json({
        success: true,
        webhook: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          secret: secret
        },
        message: 'Save the secret for webhook signature verification'
      });
    }

    // DELETE - Remove webhook
    if (method === 'DELETE') {
      const url = new URL(req.url);
      const webhookId = url.searchParams.get('id');

      if (!webhookId) {
        return Response.json({ error: 'Webhook ID required' }, { status: 400 });
      }

      const webhooks = await base44.asServiceRole.entities.WebhookEndpoint.filter({
        id: webhookId,
        user_email: apiKeyRecord.created_by
      });

      if (!webhooks || webhooks.length === 0) {
        return Response.json({ error: 'Webhook not found' }, { status: 404 });
      }

      await base44.asServiceRole.entities.WebhookEndpoint.delete(webhookId);

      return Response.json({
        success: true,
        message: 'Webhook deleted'
      });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });

  } catch (error) {
    console.error('Webhook management error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});