import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { plan_name, price_cents } = await req.json();
    
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Stripe not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    // Get or create customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || user.email,
        metadata: {
          user_email: user.email
        }
      });
    }

    const appUrl = new URL(req.url).origin;
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `IsThis.io ${plan_name}`,
            description: plan_name.includes('Lifetime') 
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
        plan_type: plan_name.includes('Lifetime') ? 'lifetime' : 'annual'
      }
    });
    
    return Response.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    }, { status: 500 });
  }
});