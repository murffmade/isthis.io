import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey || !webhookSecret) {
      console.error('Stripe configuration missing');
      return Response.json({ error: 'Configuration error' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    console.log('Webhook received:', event.type, event.id);
    
    // Check for duplicate events
    const existingEvents = await base44.asServiceRole.entities.StripeEvent.filter({
      stripe_event_id: event.id
    });
    
    if (existingEvents.length > 0 && existingEvents[0].status === 'processed') {
      console.log('Duplicate event, skipping:', event.id);
      return Response.json({ received: true, duplicate: true });
    }
    
    // Record event
    const eventRecord = existingEvents.length > 0 
      ? existingEvents[0] 
      : await base44.asServiceRole.entities.StripeEvent.create({
          stripe_event_id: event.id,
          event_type: event.type,
          status: 'received',
          payload: event.data.object
        });
    
    // Extract user email
    const metadata = event.data.object.metadata || {};
    let user_email = metadata.user_email;
    
    if (!user_email && event.data.object.customer) {
      const customer = await stripe.customers.retrieve(event.data.object.customer);
      user_email = customer.email;
    }
    
    if (!user_email) {
      console.warn('No user email found for event:', event.id);
      await base44.asServiceRole.entities.StripeEvent.update(eventRecord.id, {
        status: 'skipped',
        error_message: 'No user email'
      });
      return Response.json({ received: true, skipped: true });
    }
    
    const plan_key = metadata.plan_key;
    
    // Process different event types
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('Processing checkout.session.completed:', {
        session_id: session.id,
        payment_status: session.payment_status,
        user_email,
        plan_key
      });
      
      if (session.payment_status === 'paid') {
        // Create or update entitlement
        const existingEntitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
          user_email: user_email
        });
        
        const entitlementData = {
          user_email: user_email,
          plan_key: plan_key,
          status: 'active',
          is_trial: false,
          stripe_customer_id: session.customer,
          started_at: new Date().toISOString(),
          last_payment_at: new Date().toISOString(),
          renewal_notified: false,
          expiry_notified: false
        };
        
        // Handle subscription vs one-time payment
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          entitlementData.stripe_subscription_id = session.subscription;
          entitlementData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        } else if (session.payment_intent) {
          entitlementData.stripe_payment_intent_id = session.payment_intent;
        }
        
        if (existingEntitlements.length > 0) {
          await base44.asServiceRole.entities.UserEntitlement.update(
            existingEntitlements[0].id,
            entitlementData
          );
          console.log('Updated entitlement for:', user_email);
        } else {
          await base44.asServiceRole.entities.UserEntitlement.create(entitlementData);
          console.log('Created entitlement for:', user_email);
        }
        
        // Update purchase intent
        const intents = await base44.asServiceRole.entities.PurchaseIntent.filter({
          stripe_session_id: session.id
        });
        if (intents.length > 0) {
          await base44.asServiceRole.entities.PurchaseIntent.update(intents[0].id, {
            status: 'completed'
          });
        }
        
        // Log billing event
        await base44.asServiceRole.entities.BillingEventLog.create({
          user_email: user_email,
          event_type: 'payment_succeeded',
          message: `Payment succeeded for ${plan_key}`,
          stripe_object_id: session.id,
          metadata: { 
            plan_key, 
            amount: session.amount_total,
            mode: session.mode
          }
        });
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      
      console.log('Processing invoice.paid:', invoice.id);
      
      const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
        stripe_subscription_id: invoice.subscription
      });
      
      if (entitlements.length > 0) {
        await base44.asServiceRole.entities.UserEntitlement.update(entitlements[0].id, {
          status: 'active',
          last_payment_at: new Date().toISOString(),
          current_period_end: new Date(invoice.period_end * 1000).toISOString()
        });
        
        await base44.asServiceRole.entities.BillingEventLog.create({
          user_email: user_email,
          event_type: 'invoice_paid',
          message: 'Subscription renewed',
          stripe_object_id: invoice.id
        });
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      
      console.log('Processing invoice.payment_failed:', invoice.id);
      
      const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
        stripe_subscription_id: invoice.subscription
      });
      
      if (entitlements.length > 0) {
        await base44.asServiceRole.entities.UserEntitlement.update(entitlements[0].id, {
          status: 'past_due'
        });
        
        await base44.asServiceRole.entities.BillingEventLog.create({
          user_email: user_email,
          event_type: 'payment_failed',
          message: 'Subscription payment failed',
          stripe_object_id: invoice.id
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      
      console.log('Processing subscription.deleted:', subscription.id);
      
      const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
        stripe_subscription_id: subscription.id
      });
      
      if (entitlements.length > 0) {
        await base44.asServiceRole.entities.UserEntitlement.update(entitlements[0].id, {
          status: 'canceled'
        });
        
        await base44.asServiceRole.entities.BillingEventLog.create({
          user_email: user_email,
          event_type: 'subscription_canceled',
          message: 'Subscription canceled',
          stripe_object_id: subscription.id
        });
      }
    }
    
    // Mark event as processed
    await base44.asServiceRole.entities.StripeEvent.update(eventRecord.id, {
      status: 'processed',
      processed_at: new Date().toISOString()
    });
    
    console.log('Event processed successfully:', event.id);
    
    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});