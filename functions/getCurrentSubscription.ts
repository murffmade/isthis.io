import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    // Get user's subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      created_by: user.email
    });
    
    if (subs.length === 0) {
      return Response.json({
        success: true,
        subscription: {
          plan: 'free',
          status: 'active',
          expires_at: null,
          purchased_at: null,
          amount_paid: 0
        },
        billing_history: []
      });
    }
    
    const sub = subs[0];
    
    // Check if annual subscription has expired
    if (sub.plan === 'annual' && sub.expires_at) {
      const expiresDate = new Date(sub.expires_at);
      if (expiresDate < new Date()) {
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'expired',
          plan: 'free'
        });
        
        return Response.json({
          success: true,
          subscription: {
            plan: 'free',
            status: 'expired',
            expires_at: sub.expires_at,
            purchased_at: sub.purchased_at,
            amount_paid: sub.amount_paid
          },
          billing_history: []
        });
      }
    }

    // Fetch billing history if customer exists
    let billing_history = [];
    let payment_methods = [];
    if (sub.stripe_customer_id) {
      try {
        const charges = await stripe.charges.list({
          customer: sub.stripe_customer_id,
          limit: 10
        });
        
        billing_history = charges.data.map(charge => ({
          id: charge.id,
          amount: charge.amount / 100,
          currency: charge.currency.toUpperCase(),
          status: charge.status,
          created: charge.created * 1000,
          description: charge.description || 'IsThis.io Subscription',
          receipt_url: charge.receipt_url
        }));

        const paymentMethods = await stripe.paymentMethods.list({
          customer: sub.stripe_customer_id,
          type: 'card'
        });

        payment_methods = paymentMethods.data.map(pm => ({
          id: pm.id,
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year
        }));
      } catch (err) {
        console.error('Error fetching Stripe data:', err);
      }
    }
    
    return Response.json({
      success: true,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        expires_at: sub.expires_at,
        purchased_at: sub.purchased_at,
        amount_paid: sub.amount_paid,
        stripe_customer_id: sub.stripe_customer_id
      },
      billing_history,
      payment_methods
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});