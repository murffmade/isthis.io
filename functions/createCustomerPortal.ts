import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Stripe not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Get user's subscription to find stripe_customer_id
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_email: user.email
    });

    if (subs.length === 0 || !subs[0].stripe_customer_id) {
      return Response.json({
        success: false,
        error: 'No billing account found'
      }, { status: 404 });
    }

    const appUrl = new URL(req.url).origin;

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subs[0].stripe_customer_id,
      return_url: `${appUrl}/Account`
    });

    return Response.json({
      success: true,
      portal_url: session.url
    });
  } catch (error) {
    console.error('Portal creation error:', error);
    return Response.json({
      success: false,
      error: 'Failed to create portal session'
    }, { status: 500 });
  }
});