import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Please log in to continue' 
      }, { status: 401 });
    }

    const { plan_name, price_cents } = await req.json();
    
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    const appUrl = new URL(req.url).origin;
    const planType = plan_name.toLowerCase().includes('lifetime') ? 'lifetime' : 'annual';
    
    // Create checkout session - let Stripe handle customer creation
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `IsThis.io ${plan_name}`,
            description: planType === 'lifetime'
              ? 'Unlimited verifications, forever'
              : 'Unlimited verifications for 1 year'
          },
          unit_amount: price_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Account`,
      metadata: {
        user_email: user.email,
        plan_type: planType
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
      error: 'Failed to create checkout session'
    }, { status: 500 });
  }
});