import Stripe from 'stripe';
import { base44 } from '@base44/sdk';

export default async function stripeWebhook({ rawBody, signature }, context) {
  try {
    const stripe = new Stripe(context.secrets.STRIPE_SECRET_KEY);
    
    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        context.secrets.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return { success: false, error: 'Invalid signature' };
    }
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { user_id, user_email, plan_type } = session.metadata;
        
        // Calculate expiration date
        let expires_at = null;
        if (plan_type === 'annual') {
          const expiresDate = new Date();
          expiresDate.setFullYear(expiresDate.getFullYear() + 1);
          expires_at = expiresDate.toISOString();
        }
        
        // Create or update subscription record
        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
          created_by: user_email
        });
        
        if (existingSubs.length > 0) {
          // Update existing subscription
          await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
            plan: plan_type,
            status: 'active',
            stripe_customer_id: session.customer,
            stripe_payment_intent_id: session.payment_intent,
            expires_at: expires_at,
            purchased_at: new Date().toISOString(),
            amount_paid: session.amount_total
          });
        } else {
          // Create new subscription
          await base44.asServiceRole.entities.Subscription.create({
            created_by: user_email,
            plan: plan_type,
            status: 'active',
            stripe_customer_id: session.customer,
            stripe_payment_intent_id: session.payment_intent,
            expires_at: expires_at,
            purchased_at: new Date().toISOString(),
            amount_paid: session.amount_total
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Find subscription by Stripe customer ID
        const subs = await base44.asServiceRole.entities.Subscription.filter({
          stripe_customer_id: subscription.customer
        });
        
        if (subs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
            status: subscription.status === 'active' ? 'active' : 'cancelled'
          });
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return { success: true, received: true };
  } catch (error) {
    console.error('Webhook error:', error);
    return { success: false, error: error.message };
  }
}