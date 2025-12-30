import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    if (!Deno.env.get('STRIPE_SECRET_KEY') || !Deno.env.get('STRIPE_WEBHOOK_SECRET')) {
      console.error('Stripe secrets not configured');
      return Response.json({ error: 'Not configured' }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const sig = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_email, plan_type } = session.metadata;
      
      console.log('Processing payment for:', user_email, 'Plan:', plan_type);
      
      if (!user_email || !plan_type) {
        console.error('Missing metadata in session');
        return Response.json({ received: true });
      }
      
      // Calculate expiration date
      let expires_at = null;
      if (plan_type === 'annual') {
        const expiresDate = new Date();
        expiresDate.setFullYear(expiresDate.getFullYear() + 1);
        expires_at = expiresDate.toISOString();
      }
      
      // Create or update subscription record
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
        user_email: user_email
      });
      
      const subData = {
        user_email: user_email,
        plan: plan_type,
        status: 'active',
        stripe_customer_id: session.customer,
        stripe_payment_intent_id: session.payment_intent,
        expires_at: expires_at,
        purchased_at: new Date().toISOString(),
        amount_paid: session.amount_total || 0
      };

      if (existingSubs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subData);
        console.log('Updated subscription:', existingSubs[0].id);
      } else {
        await base44.asServiceRole.entities.Subscription.create(subData);
        console.log('Created new subscription for', user_email);
      }
    }
    
    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});