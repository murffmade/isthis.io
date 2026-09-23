import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
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

    // Verify Stripe configuration
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    // Fetch active plan from database
    const plans = await base44.asServiceRole.entities.PlanConfig.filter({
      plan_key: plan_key,
      active: true
    });

    if (plans.length === 0) {
      console.error('Plan not found:', plan_key);
      return Response.json({
        success: false,
        error: 'Invalid or inactive plan'
      }, { status: 400 });
    }

    const plan = plans[0];
    
    if (!plan.stripe_price_id) {
      console.error('Plan missing stripe_price_id:', plan_key);
      return Response.json({
        success: false,
        error: 'Plan not configured for payments'
      }, { status: 400 });
    }

    console.log('Creating checkout for plan:', {
      plan_key: plan.plan_key,
      stripe_price_id: plan.stripe_price_id,
      mode: plan.mode,
      user_email: user.email
    });

    const stripe = new Stripe(stripeKey);
    const appUrl = new URL(req.url).origin;
    
    // Create purchase intent for tracking
    const intent = await base44.asServiceRole.entities.PurchaseIntent.create({
      user_email: user.email,
      plan_key: plan.plan_key,
      status: 'initiated'
    });
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: plan.stripe_price_id,
        quantity: 1,
      }],
      mode: plan.mode,
      success_url: `${appUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        user_email: user.email,
        user_id: user.id,
        plan_key: plan.plan_key,
        intent_id: intent.id
      }
    });
    
    // Update intent with session ID
    await base44.asServiceRole.entities.PurchaseIntent.update(intent.id, {
      stripe_session_id: session.id,
      status: 'checkout_created'
    });
    
    console.log('Checkout session created:', session.id);
    
    return Response.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Checkout creation failed:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to create checkout'
    }, { status: 500 });
  }
});