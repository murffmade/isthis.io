import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        success: true,
        subscription: { plan: 'free', status: 'active' },
        billing_history: [],
        payment_methods: []
      });
    }

    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_email: user.email
    });

    if (subs.length === 0) {
      return Response.json({
        success: true,
        subscription: { plan: 'free', status: 'active' },
        billing_history: [],
        payment_methods: []
      });
    }

    const sub = subs[0];
    return Response.json({
      success: true,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        expires_at: sub.expires_at,
        purchased_at: sub.purchased_at,
        amount_paid: sub.amount_paid || 0,
        stripe_customer_id: sub.stripe_customer_id
      },
      billing_history: [],
      payment_methods: []
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      success: true,
      subscription: { plan: 'free', status: 'active' },
      billing_history: [],
      payment_methods: []
    });
  }
});