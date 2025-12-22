import Stripe from 'stripe';
import { base44 } from '@base44/sdk';

export default async function getCustomerPortalUrl({}, context) {
  try {
    const stripe = new Stripe(context.secrets.STRIPE_SECRET_KEY);
    
    // Get user's subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      created_by: context.user.email
    });
    
    if (subs.length === 0 || !subs[0].stripe_customer_id) {
      return {
        success: false,
        error: 'No payment methods found'
      };
    }
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subs[0].stripe_customer_id,
      return_url: `${context.appUrl}/Account`
    });
    
    return {
      success: true,
      portal_url: session.url
    };
  } catch (error) {
    console.error('Customer portal error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create portal session'
    };
  }
}