import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { session_id } = await req.json();
    
    if (!session_id) {
      return Response.json({
        success: false,
        error: 'session_id required'
      }, { status: 400 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    console.log('Verifying session:', {
      session_id,
      payment_status: session.payment_status,
      customer_email: session.customer_email
    });
    
    if (session.payment_status !== 'paid') {
      return Response.json({
        success: false,
        paid: false,
        error: 'Payment not completed'
      });
    }
    
    // Check if entitlement exists and is active
    const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
      user_email: session.customer_email
    });
    
    if (entitlements.length > 0 && entitlements[0].status === 'active') {
      return Response.json({
        success: true,
        paid: true,
        status: 'active',
        entitlement: {
          plan_key: entitlements[0].plan_key,
          started_at: entitlements[0].started_at
        }
      });
    }
    
    // Payment confirmed but entitlement not yet active
    return Response.json({
      success: true,
      paid: true,
      status: 'pending',
      message: 'Payment confirmed, activating subscription...'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});