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

    const { plan_key } = await req.json();
    
    if (!plan_key) {
      return Response.json({
        success: false,
        error: 'plan_key is required'
      }, { status: 400 });
    }

    // Fetch plan from server-trusted catalog
    const plans = await base44.asServiceRole.entities.PlanConfig.filter({
      plan_key: plan_key,
      active: true
    });

    if (plans.length === 0) {
      return Response.json({
        success: false,
        error: 'Invalid or inactive plan'
      }, { status: 400 });
    }

    const plan = plans[0];
    
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const appUrl = new URL(req.url).origin;
    
    // Create purchase intent
    const intent = await base44.asServiceRole.entities.PurchaseIntent.create({
      user_email: user.email,
      plan_key: plan_key,
      status: 'created'
    });
    
    // Log billing event
    await base44.asServiceRole.entities.BillingEventLog.create({
      user_email: user.email,
      event_type: 'purchase_initiated',
      message: `User initiated purchase of ${plan.display_name}`,
      metadata: { plan_key, intent_id: intent.id }
    });
    
    // Create Stripe checkout session using ONLY server-side price
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: plan.stripe_price_id, // Server-trusted Stripe Price ID
        quantity: 1,
      }],
      mode: plan.mode, // 'payment' or 'subscription'
      success_url: `${appUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        user_email: user.email,
        user_id: user.id,
        plan_key: plan_key,
        intent_id: intent.id
      }
    });
    
    // Update intent with session ID
    await base44.asServiceRole.entities.PurchaseIntent.update(intent.id, {
      stripe_session_id: session.id,
      status: 'redirected'
    });
    
    return Response.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
      intent_id: intent.id
    });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    }, { status: 500 });
  }
});