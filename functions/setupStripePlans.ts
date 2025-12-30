import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // REQUIRED: User must be authenticated and admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false,
        error: 'Admin access required' 
      }, { status: 403 });
    }

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return Response.json({
        success: false,
        error: 'Stripe not configured'
      }, { status: 500 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Define plan configurations
    const planConfigs = [
      {
        plan_key: 'monthly',
        display_name: 'Basic Monthly',
        description: '25 verifications per month with advanced AI detection',
        amount: 999, // $9.99 in cents
        currency: 'usd',
        interval: 'month',
        mode: 'subscription'
      },
      {
        plan_key: 'annual',
        display_name: 'Premium Annual',
        description: 'Unlimited verifications with priority analysis',
        amount: 2900, // $29 in cents
        currency: 'usd',
        interval: 'year',
        mode: 'subscription'
      },
      {
        plan_key: 'lifetime',
        display_name: 'Lifetime Premium',
        description: 'Lifetime access to all premium features',
        amount: 9900, // $99 in cents
        currency: 'usd',
        interval: null,
        mode: 'payment'
      }
    ];

    const results = [];

    for (const config of planConfigs) {
      // Create Stripe Product
      const product = await stripe.products.create({
        name: config.display_name,
        description: config.description,
        metadata: {
          plan_key: config.plan_key
        }
      });

      // Create Stripe Price
      const priceParams = {
        product: product.id,
        unit_amount: config.amount,
        currency: config.currency,
        metadata: {
          plan_key: config.plan_key
        }
      };

      if (config.interval) {
        priceParams.recurring = { interval: config.interval };
      }

      const price = await stripe.prices.create(priceParams);

      // Update PlanConfig with Stripe Price ID
      const plans = await base44.asServiceRole.entities.PlanConfig.filter({
        plan_key: config.plan_key
      });

      if (plans.length > 0) {
        await base44.asServiceRole.entities.PlanConfig.update(plans[0].id, {
          stripe_price_id: price.id,
          mode: config.mode,
          interval: config.interval || 'one_time',
          price_cents: config.amount
        });

        results.push({
          plan_key: config.plan_key,
          product_id: product.id,
          price_id: price.id,
          updated: true
        });
      } else {
        results.push({
          plan_key: config.plan_key,
          product_id: product.id,
          price_id: price.id,
          updated: false,
          error: 'PlanConfig not found'
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Stripe plans configured successfully',
      results
    });
  } catch (error) {
    console.error('setupStripePlans error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to setup Stripe plans'
    }, { status: 500 });
  }
});