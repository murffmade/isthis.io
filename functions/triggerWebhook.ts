import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

async function sendWebhook(webhook, payload) {
  try {
    // Create signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IsThis-Signature': signature,
        'X-IsThis-Event': payload.event
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook delivery failed:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data, user_email } = await req.json();

    if (!event || !data || !user_email) {
      return Response.json({ error: 'Event, data, and user_email required' }, { status: 400 });
    }

    // Find active webhooks for this user and event
    const allWebhooks = await base44.asServiceRole.entities.WebhookEndpoint.filter({
      user_email,
      is_active: true
    });

    const webhooks = allWebhooks.filter(w => w.events.includes(event));

    if (webhooks.length === 0) {
      return Response.json({ success: true, message: 'No webhooks to trigger' });
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    // Send to all matching webhooks
    const results = await Promise.all(
      webhooks.map(async (webhook) => {
        const success = await sendWebhook(webhook, payload);
        
        // Update webhook stats
        if (success) {
          await base44.asServiceRole.entities.WebhookEndpoint.update(webhook.id, {
            failure_count: 0,
            last_success: new Date().toISOString()
          });
        } else {
          const newFailureCount = (webhook.failure_count || 0) + 1;
          await base44.asServiceRole.entities.WebhookEndpoint.update(webhook.id, {
            failure_count: newFailureCount,
            last_failure: new Date().toISOString(),
            is_active: newFailureCount < 10 // Disable after 10 failures
          });
        }

        return { webhook_id: webhook.id, success };
      })
    );

    return Response.json({
      success: true,
      delivered: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Trigger webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});