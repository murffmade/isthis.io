import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    // PUBLIC ENDPOINT - No auth required
    const base44 = createClientFromRequest(req);
    
    const { session_id } = await req.json();
    
    if (!session_id) {
      return Response.json({
        success: false,
        error: 'session_id required'
      }, { status: 400 });
    }

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      return Response.json({
        success: true,
        paid: true,
        plan_key: session.metadata.plan_key,
        user_email: session.metadata.base44_user_email,
        amount: session.amount_total
      });
    } else {
      return Response.json({
        success: true,
        paid: false,
        status: session.payment_status
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({
      success: false,
      error: 'Failed to verify payment'
    }, { status: 500 });
  }
});