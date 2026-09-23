import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { new_plan_key } = await req.json();
    
    if (!new_plan_key) {
      return Response.json({
        success: false,
        error: 'new_plan_key is required'
      }, { status: 400 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({
        success: false,
        error: 'Payment system not configured'
      }, { status: 500 });
    }

    // Get user's current entitlement
    const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
      user_email: user.email
    });

    if (entitlements.length === 0) {
      return Response.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 400 });
    }

    const currentEntitlement = entitlements[0];
    
    if (!currentEntitlement.stripe_subscription_id) {
      return Response.json({
        success: false,
        error: 'Only active subscriptions can be changed'
      }, { status: 400 });
    }

    // Fetch new plan
    const newPlans = await base44.asServiceRole.entities.PlanConfig.filter({
      plan_key: new_plan_key,
      active: true
    });

    if (newPlans.length === 0) {
      return Response.json({
        success: false,
        error: 'New plan not found'
      }, { status: 400 });
    }

    const newPlan = newPlans[0];
    
    if (newPlan.mode !== 'subscription') {
      return Response.json({
        success: false,
        error: 'Can only change to subscription plans'
      }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);
    
    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(
      currentEntitlement.stripe_subscription_id
    );

    console.log('Changing plan from', currentEntitlement.plan_key, 'to', new_plan_key);

    // Update subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        items: [{
          id: subscription.items.data[0].id,
          price: newPlan.stripe_price_id,
        }],
        proration_behavior: 'always_invoice', // Create invoice with proration
        metadata: {
          plan_key: new_plan_key,
          previous_plan_key: currentEntitlement.plan_key
        }
      }
    );

    // Update entitlement
    await base44.asServiceRole.entities.UserEntitlement.update(
      currentEntitlement.id,
      {
        plan_key: new_plan_key,
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString()
      }
    );

    // Log the plan change
    await base44.asServiceRole.entities.BillingEventLog.create({
      user_email: user.email,
      event_type: 'plan_changed',
      message: `Plan changed from ${currentEntitlement.plan_key} to ${new_plan_key}`,
      metadata: { 
        old_plan: currentEntitlement.plan_key,
        new_plan: new_plan_key,
        subscription_id: subscription.id,
        proration_applied: true
      }
    });

    // Calculate proration amount if available
    let prorationAmount = null;
    if (updatedSubscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(updatedSubscription.latest_invoice);
      const prorationLines = invoice.lines.data.filter(line => line.proration);
      if (prorationLines.length > 0) {
        prorationAmount = prorationLines.reduce((sum, line) => sum + line.amount, 0) / 100;
      }
    }

    console.log('Plan changed successfully. Proration:', prorationAmount);

    return Response.json({
      success: true,
      new_plan_key,
      subscription_id: updatedSubscription.id,
      proration_amount: prorationAmount,
      next_billing_date: new Date(updatedSubscription.current_period_end * 1000).toISOString()
    });
  } catch (error) {
    console.error('Plan change error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});