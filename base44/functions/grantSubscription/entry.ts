import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { user_email, plan } = await req.json();
    
    if (!user_email || !plan) {
      return Response.json({ error: 'user_email and plan are required' }, { status: 400 });
    }

    if (!['annual', 'lifetime'].includes(plan)) {
      return Response.json({ error: 'Invalid plan. Use "annual" or "lifetime"' }, { status: 400 });
    }

    // Check if user already has a subscription
    const existing = await base44.asServiceRole.entities.Subscription.filter({ 
      user_email 
    });

    const subscriptionData = {
      user_email,
      plan,
      status: 'active',
      purchased_at: new Date().toISOString(),
      amount_paid: plan === 'lifetime' ? 9900 : 2900,
      granted_by_admin: true,
      expires_at: plan === 'annual' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(existing[0].id, subscriptionData);
    } else {
      await base44.asServiceRole.entities.Subscription.create(subscriptionData);
    }

    // Log the action
    await base44.asServiceRole.entities.BillingEventLog.create({
      user_email,
      event_type: 'admin_grant',
      message: `Admin ${user.email} granted ${plan} subscription to ${user_email}`
    });

    return Response.json({ 
      success: true, 
      message: `${plan} subscription granted to ${user_email}` 
    });
  } catch (error) {
    console.error('Grant subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});