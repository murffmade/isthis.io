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

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    // Fetch plan config from database (server-side trusted source)
    const planConfigs = await base44.asServiceRole.entities.PlanConfig.filter({
      plan_key: plan_key,
      active: true
    });

    if (planConfigs.length === 0) {
      return Response.json({
        success: false,
        error: 'Invalid plan'
      }, { status: 400 });
    }

    const planConfig = planConfigs[0];
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    const appUrl = new URL(req.url).origin;
    
    // Create checkout session with server-side price
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: planConfig.display_name,
            description: planConfig.features?.join(', ') || ''
          },
          unit_amount: Math.round(planConfig.price_usd * 100), // Cents, no float issues
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Account`,
      metadata: {
        base44_user_email: user.email,
        base44_user_id: user.id,
        plan_key: plan_key
      }
    });
    
    return Response.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    }, { status: 500 });
  }
});