import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    if (!Deno.env.get('STRIPE_SECRET_KEY') || !Deno.env.get('STRIPE_WEBHOOK_SECRET')) {
      console.error('Missing Stripe configuration');
      return Response.json({ success: false }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    console.log('Webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      if (session.payment_status === 'paid') {
        const userEmail = session.metadata.base44_user_email;
        const planKey = session.metadata.plan_key;
        
        if (!userEmail || !planKey) {
          console.error('Missing metadata in session:', session.id);
          return Response.json({ success: false, error: 'Missing metadata' }, { status: 400 });
        }

        // Calculate period end for annual plans
        let periodEnd = null;
        if (planKey === 'annual') {
          const now = new Date();
          periodEnd = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
        }

        // Upsert entitlement (authoritative source)
        const existing = await base44.asServiceRole.entities.UserEntitlement.filter({
          user_email: userEmail
        });

        if (existing.length > 0) {
          await base44.asServiceRole.entities.UserEntitlement.update(existing[0].id, {
            plan_key: planKey,
            status: 'active',
            started_at: new Date().toISOString(),
            current_period_end: periodEnd,
            stripe_customer_id: session.customer,
            stripe_payment_intent_id: session.payment_intent,
            last_payment_at: new Date().toISOString()
          });
        } else {
          await base44.asServiceRole.entities.UserEntitlement.create({
            user_email: userEmail,
            plan_key: planKey,
            status: 'active',
            started_at: new Date().toISOString(),
            current_period_end: periodEnd,
            stripe_customer_id: session.customer,
            stripe_payment_intent_id: session.payment_intent,
            last_payment_at: new Date().toISOString()
          });
        }

        // Also update legacy Subscription entity for backward compatibility
        const legacySubs = await base44.asServiceRole.entities.Subscription.filter({
          user_email: userEmail
        });

        const legacyData = {
          plan: planKey,
          status: 'active',
          stripe_customer_id: session.customer,
          stripe_payment_intent_id: session.payment_intent,
          expires_at: periodEnd,
          purchased_at: new Date().toISOString(),
          amount_paid: session.amount_total
        };

        if (legacySubs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(legacySubs[0].id, legacyData);
        } else {
          await base44.asServiceRole.entities.Subscription.create(legacyData);
        }

        console.log('Entitlement granted:', userEmail, planKey);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});