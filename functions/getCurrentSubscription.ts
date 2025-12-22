import { base44 } from '@base44/sdk';

export default async function getCurrentSubscription({}, context) {
  try {
    // Get user's subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      created_by: context.user.email
    });
    
    if (subs.length === 0) {
      // Return free plan by default
      return {
        success: true,
        subscription: {
          plan: 'free',
          status: 'active',
          expires_at: null,
          purchased_at: null,
          amount_paid: 0
        }
      };
    }
    
    const sub = subs[0];
    
    // Check if annual subscription has expired
    if (sub.plan === 'annual' && sub.expires_at) {
      const expiresDate = new Date(sub.expires_at);
      if (expiresDate < new Date()) {
        // Update to expired
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'expired',
          plan: 'free'
        });
        
        return {
          success: true,
          subscription: {
            plan: 'free',
            status: 'expired',
            expires_at: sub.expires_at,
            purchased_at: sub.purchased_at,
            amount_paid: sub.amount_paid
          }
        };
      }
    }
    
    return {
      success: true,
      subscription: {
        plan: sub.plan,
        status: sub.status,
        expires_at: sub.expires_at,
        purchased_at: sub.purchased_at,
        amount_paid: sub.amount_paid,
        stripe_customer_id: sub.stripe_customer_id
      }
    };
  } catch (error) {
    console.error('Get subscription error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}