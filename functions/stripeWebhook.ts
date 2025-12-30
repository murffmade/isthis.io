import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    if (!Deno.env.get('STRIPE_SECRET_KEY') || !Deno.env.get('STRIPE_WEBHOOK_SECRET')) {
      console.error('Stripe not configured');
      return Response.json({ received: false }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    // Idempotency check
    const existingEvents = await base44.asServiceRole.entities.StripeEvent.filter({
      stripe_event_id: event.id
    });
    
    if (existingEvents.length > 0 && existingEvents[0].status === 'processed') {
      console.log('Event already processed:', event.id);
      return Response.json({ received: true, status: 'duplicate' });
    }
    
    // Record event
    const eventRecord = existingEvents.length > 0 ? existingEvents[0] : await base44.asServiceRole.entities.StripeEvent.create({
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'received',
      payload: event.data.object
    });
    
    // Process event
    let user_email = null;
    const metadata = event.data.object.metadata || {};
    
    // Extract user email from metadata or customer
    if (metadata.user_email) {
      user_email = metadata.user_email;
    } else if (event.data.object.customer) {
      // Lookup customer to find email
      const customer = await stripe.customers.retrieve(event.data.object.customer);
      user_email = customer.email;
    }
    
    if (!user_email) {
      console.warn('No user_email found for event:', event.id);
      await base44.asServiceRole.entities.StripeEvent.update(eventRecord.id, {
        status: 'ignored',
        error_message: 'No user email found'
      });
      return Response.json({ received: true, status: 'ignored' });
    }
    
    const plan_key = metadata.plan_key;
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.payment_status === 'paid') {
          // Grant entitlement
          const existingEntitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
            user_email: user_email
          });
          
          const entitlementData = {
            user_email: user_email,
            plan_key: plan_key,
            status: 'active',
            stripe_customer_id: session.customer,
            started_at: new Date().toISOString(),
            last_payment_at: new Date().toISOString()
          };
          
          if (session.mode === 'subscription' && session.subscription) {
            entitlementData.stripe_subscription_id = session.subscription;
            // Fetch subscription to get period end
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            entitlementData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          } else if (session.payment_intent) {
            entitlementData.stripe_payment_intent_id = session.payment_intent;
          }
          
          if (existingEntitlements.length > 0) {
            await base44.asServiceRole.entities.UserEntitlement.update(
              existingEntitlements[0].id,
              entitlementData
            );
          } else {
            await base44.asServiceRole.entities.UserEntitlement.create(entitlementData);
          }
          
          // Update purchase intent
          const intents = await base44.asServiceRole.entities.PurchaseIntent.filter({
            stripe_session_id: session.id
          });
          if (intents.length > 0) {
            await base44.asServiceRole.entities.PurchaseIntent.update(intents[0].id, {
              status: 'paid'
            });
          }
          
          // Log event
          await base44.asServiceRole.entities.BillingEventLog.create({
            user_email: user_email,
            event_type: 'payment_succeeded',
            message: `Payment succeeded for ${plan_key}`,
            stripe_object_id: session.id,
            metadata: { plan_key, amount: session.amount_total }
          });
        }
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        
        // Update entitlement with new period end
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
            message: 'Subscription invoice paid',
            stripe_object_id: invoice.id
          });
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
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
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
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
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object;
        
        // Find entitlement by customer
        const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
          stripe_customer_id: charge.customer
        });
        
        if (entitlements.length > 0) {
          await base44.asServiceRole.entities.UserEntitlement.update(entitlements[0].id, {
            status: 'refunded'
          });
          
          await base44.asServiceRole.entities.BillingEventLog.create({
            user_email: user_email,
            event_type: 'charge_refunded',
            message: 'Charge refunded',
            stripe_object_id: charge.id
          });
        }
        break;
      }
      
      case 'charge.dispute.created': {
        const dispute = event.data.object;
        
        await base44.asServiceRole.entities.BillingEventLog.create({
          user_email: user_email,
          event_type: 'dispute_created',
          message: 'Dispute created',
          stripe_object_id: dispute.id
        });
        break;
      }
    }
    
    // Mark event as processed
    await base44.asServiceRole.entities.StripeEvent.update(eventRecord.id, {
      status: 'processed',
      processed_at: new Date().toISOString()
    });
    
    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Try to log error
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.text();
      const event = JSON.parse(body);
      
      const eventRecords = await base44.asServiceRole.entities.StripeEvent.filter({
        stripe_event_id: event.id
      });
      
      if (eventRecords.length > 0) {
        await base44.asServiceRole.entities.StripeEvent.update(eventRecords[0].id, {
          status: 'error',
          error_message: error.message
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
});