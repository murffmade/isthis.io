import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is a scheduled task - verify it's not being called by regular users
    const user = await base44.auth.me().catch(() => null);
    
    // If there's a user, verify they're admin (scheduled tasks shouldn't have user context)
    if (user && user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    console.log('Checking for expiring subscriptions...');

    // Get all active entitlements
    const activeEntitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
      status: 'active'
    });

    console.log('Found', activeEntitlements.length, 'active entitlements');

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    let renewalNotifications = 0;
    let expiryNotifications = 0;

    for (const entitlement of activeEntitlements) {
      if (!entitlement.current_period_end) continue;

      const periodEnd = new Date(entitlement.current_period_end);
      
      // Check if period ends soon
      const isExpiringSoon = periodEnd <= sevenDaysFromNow;
      const isExpiringVerySoon = periodEnd <= threeDaysFromNow;

      // For subscriptions (recurring) - send renewal reminder
      if (entitlement.stripe_subscription_id) {
        if (isExpiringVerySoon && !entitlement.renewal_notified) {
          // Send renewal notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: entitlement.user_email,
            subject: 'Your subscription renews soon',
            body: `Hi there,

Your ${entitlement.plan_key} subscription will automatically renew on ${periodEnd.toLocaleDateString()}.

Your payment method will be charged automatically. No action is needed unless you want to make changes.

To manage your subscription, visit: ${req.headers.get('origin')}/Account

Thank you for being a valued customer!`
          });

          await base44.asServiceRole.entities.UserEntitlement.update(entitlement.id, {
            renewal_notified: true
          });

          await base44.asServiceRole.entities.BillingEventLog.create({
            user_email: entitlement.user_email,
            event_type: 'renewal_notification_sent',
            message: 'Renewal notification sent',
            metadata: { 
              plan_key: entitlement.plan_key,
              renewal_date: periodEnd.toISOString()
            }
          });

          renewalNotifications++;
          console.log('Sent renewal notification to:', entitlement.user_email);
        }
      } 
      // For one-time payments or trials - send expiry warning
      else if (entitlement.stripe_payment_intent_id || entitlement.is_trial) {
        if (isExpiringSoon && !entitlement.expiry_notified) {
          const isTrial = entitlement.is_trial;
          
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: entitlement.user_email,
            subject: isTrial ? 'Your trial is ending soon' : 'Your subscription is expiring soon',
            body: `Hi there,

Your ${isTrial ? 'trial period' : entitlement.plan_key + ' subscription'} will expire on ${periodEnd.toLocaleDateString()}.

${isTrial ? 'To continue enjoying premium features, upgrade to a paid plan before your trial ends.' : 'To continue your access, please renew your subscription.'}

Renew now: ${req.headers.get('origin')}/Pricing

Questions? Contact us at ${req.headers.get('origin')}/Support

Thank you!`
          });

          await base44.asServiceRole.entities.UserEntitlement.update(entitlement.id, {
            expiry_notified: true
          });

          await base44.asServiceRole.entities.BillingEventLog.create({
            user_email: entitlement.user_email,
            event_type: 'expiry_notification_sent',
            message: isTrial ? 'Trial expiry notification sent' : 'Expiry notification sent',
            metadata: { 
              plan_key: entitlement.plan_key,
              expiry_date: periodEnd.toISOString(),
              is_trial: isTrial
            }
          });

          expiryNotifications++;
          console.log('Sent expiry notification to:', entitlement.user_email);
        }
      }
    }

    // Check for expired entitlements and update status
    const expiredEntitlements = activeEntitlements.filter(e => {
      if (!e.current_period_end) return false;
      return new Date(e.current_period_end) < now;
    });

    for (const entitlement of expiredEntitlements) {
      // Only mark as expired if it's not a recurring subscription
      if (!entitlement.stripe_subscription_id) {
        await base44.asServiceRole.entities.UserEntitlement.update(entitlement.id, {
          status: 'expired'
        });

        await base44.asServiceRole.entities.BillingEventLog.create({
          user_email: entitlement.user_email,
          event_type: 'subscription_expired',
          message: entitlement.is_trial ? 'Trial period expired' : 'Subscription expired',
          metadata: { 
            plan_key: entitlement.plan_key,
            expired_at: entitlement.current_period_end
          }
        });

        console.log('Marked as expired:', entitlement.user_email);
      }
    }

    console.log('Subscription check complete:', {
      renewal_notifications: renewalNotifications,
      expiry_notifications: expiryNotifications,
      expired_count: expiredEntitlements.filter(e => !e.stripe_subscription_id).length
    });

    return Response.json({
      success: true,
      renewal_notifications: renewalNotifications,
      expiry_notifications: expiryNotifications,
      expired_count: expiredEntitlements.filter(e => !e.stripe_subscription_id).length
    });
  } catch (error) {
    console.error('Check expiring subscriptions error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});