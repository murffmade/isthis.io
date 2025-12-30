import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await req.json();
    
    if (!session_id) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return Response.json({
        success: false,
        paid: false,
        status: session.payment_status
      });
    }

    const { user_email, plan_type } = session.metadata;
    
    // Ensure subscription is created
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
      user_email: user_email
    });
    
    if (existingSubs.length === 0) {
      // Create subscription if webhook hasn't processed yet
      let expires_at = null;
      if (plan_type === 'annual') {
        const expiresDate = new Date();
        expiresDate.setFullYear(expiresDate.getFullYear() + 1);
        expires_at = expiresDate.toISOString();
      }

      await base44.asServiceRole.entities.Subscription.create({
        user_email: user_email,
        plan: plan_type,
        status: 'active',
        stripe_customer_id: session.customer,
        stripe_payment_intent_id: session.payment_intent,
        expires_at: expires_at,
        purchased_at: new Date().toISOString(),
        amount_paid: session.amount_total
      });
    }

    return Response.json({
      success: true,
      paid: true,
      plan: plan_type
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});