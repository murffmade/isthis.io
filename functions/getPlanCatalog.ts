import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // PUBLIC endpoint - no auth required
    const base44 = createClientFromRequest(req);
    
    // Fetch active plans sorted by display order
    const plans = await base44.asServiceRole.entities.PlanConfig.filter({ active: true });
    
    // Sort by display_order
    const sortedPlans = plans.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    // Return public-safe plan data (no sensitive Stripe IDs exposed beyond what's needed)
    const publicPlans = sortedPlans.map(plan => ({
      plan_key: plan.plan_key,
      display_name: plan.display_name,
      description: plan.description,
      interval: plan.interval,
      price_cents: plan.price_cents,
      currency: plan.currency,
      features: plan.features || []
    }));
    
    return Response.json({
      success: true,
      plans: publicPlans
    });
  } catch (error) {
    console.error('getPlanCatalog error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});