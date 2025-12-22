import Stripe from 'stripe';

export default async function createCheckoutSession({ plan_name, price_cents }, context) {
  try {
    const stripe = new Stripe(context.secrets.STRIPE_SECRET_KEY);
    
    // Get or create customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: context.user.email,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: context.user.email,
        metadata: {
          user_id: context.user.id,
          user_email: context.user.email
        }
      });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `IsThis.io ${plan_name}`,
            description: plan_name === 'Lifetime Premium' 
              ? 'Unlimited verifications, forever'
              : 'Unlimited verifications for 1 year'
          },
          unit_amount: price_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${context.appUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${context.appUrl}/Home`,
      metadata: {
        user_id: context.user.id,
        user_email: context.user.email,
        plan_name: plan_name,
        plan_type: plan_name.includes('Lifetime') ? 'lifetime' : 'annual'
      }
    });
    
    return {
      success: true,
      checkout_url: session.url,
      session_id: session.id
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session'
    };
  }
}