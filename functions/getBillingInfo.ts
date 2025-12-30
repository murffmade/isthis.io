import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({ 
        success: true, 
        billing_history: [], 
        payment_methods: [] 
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Get user's subscription to find stripe_customer_id
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_email: user.email
    });

    if (subs.length === 0 || !subs[0].stripe_customer_id) {
      return Response.json({
        success: true,
        billing_history: [],
        payment_methods: []
      });
    }

    const customerId = subs[0].stripe_customer_id;

    // Fetch payment intents (billing history)
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 10
    });

    const billing_history = charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      created: charge.created,
      receipt_url: charge.receipt_url,
      description: charge.description
    }));

    // Fetch payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    const payment_methods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year
    }));

    return Response.json({
      success: true,
      billing_history,
      payment_methods
    });
  } catch (error) {
    console.error('Billing info error:', error);
    return Response.json({
      success: true,
      billing_history: [],
      payment_methods: []
    });
  }
});