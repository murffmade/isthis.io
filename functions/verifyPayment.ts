import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    // PUBLIC endpoint - must work even if user is logged out
    const base44 = createClientFromRequest(req);
    
    const { session_id } = await req.json();
    
    if (!session_id) {
      return Response.json({
        success: false,
        error: 'session_id is required'
      }, { status: 400 });
    }

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    const paid = session.payment_status === 'paid';
    const user_email = session.metadata?.user_email;
    const plan_key = session.metadata?.plan_key;
    
    if (!paid) {
      return Response.json({
        success: true,
        paid: false,
        status: 'unpaid'
      });
    }
    
    // Check if entitlement exists and is active
    let entitlementStatus = 'pending';
    if (user_email) {
      const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
        user_email: user_email
      });
      
      if (entitlements.length > 0 && entitlements[0].status === 'active') {
        entitlementStatus = 'active';
      }
    }
    
    return Response.json({
      success: true,
      paid: true,
      status: entitlementStatus,
      plan_key: plan_key,
      user_email: user_email
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to verify payment'
    }, { status: 500 });
  }
});