import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const { plan_key } = await req.json();
    
    // Check if user already has an entitlement
    const existingEntitlements = await base44.asServiceRole.entities.UserEntitlement.filter({
      user_email: user.email
    });
    
    if (existingEntitlements.length > 0) {
      return Response.json({
        success: false,
        error: 'User already has an entitlement'
      }, { status: 400 });
    }

    // Fetch plan configuration
    const plans = await base44.asServiceRole.entities.PlanConfig.filter({
      plan_key: plan_key || 'monthly', // Default to monthly if not specified
      active: true
    });

    if (plans.length === 0) {
      return Response.json({
        success: false,
        error: 'Plan not found'
      }, { status: 400 });
    }

    const plan = plans[0];
    const trialDays = plan.trial_days || 7; // Default 7 days if not specified
    
    if (trialDays === 0) {
      return Response.json({
        success: false,
        error: 'This plan does not offer a trial'
      }, { status: 400 });
    }

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // Create trial entitlement
    const entitlement = await base44.asServiceRole.entities.UserEntitlement.create({
      user_email: user.email,
      plan_key: plan.plan_key,
      status: 'trial',
      is_trial: true,
      trial_ends_at: trialEndsAt.toISOString(),
      started_at: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString()
    });

    // Log the trial grant
    await base44.asServiceRole.entities.BillingEventLog.create({
      user_email: user.email,
      event_type: 'trial_started',
      message: `Trial period started for ${plan.display_name} (${trialDays} days)`,
      metadata: { 
        plan_key: plan.plan_key,
        trial_days: trialDays,
        trial_ends_at: trialEndsAt.toISOString()
      }
    });

    console.log('Trial granted:', user.email, plan.plan_key, trialDays, 'days');

    return Response.json({
      success: true,
      entitlement,
      trial_days: trialDays,
      trial_ends_at: trialEndsAt.toISOString()
    });
  } catch (error) {
    console.error('Grant trial error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});