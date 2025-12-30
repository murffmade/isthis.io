import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // REQUIRED: User must be authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    // Get user's entitlement to find customer ID
    const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
      user_email: user.email
    });
    
    if (entitlements.length === 0 || !entitlements[0].stripe_customer_id) {
      return Response.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const appUrl = new URL(req.url).origin;
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: entitlements[0].stripe_customer_id,
      return_url: `${appUrl}/account`,
    });
    
    return Response.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('createCustomerPortalSession error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to create portal session'
    }, { status: 500 });
  }
});