import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_id, content, ground_truth } = await req.json();
    
    if (!test_id || !content) {
      return Response.json({ error: 'test_id and content are required' }, { status: 400 });
    }

    // Fetch A/B test configuration
    const tests = await base44.entities.ABTest.filter({ id: test_id });
    if (tests.length === 0) {
      return Response.json({ error: 'A/B test not found' }, { status: 404 });
    }
    
    const abTest = tests[0];
    
    if (abTest.status !== 'running') {
      return Response.json({ error: 'Test is not running' }, { status: 400 });
    }

    // Randomly assign variant based on traffic split
    const random = Math.random() * 100;
    const useVariantB = random < abTest.traffic_split;
    const variant = useVariantB ? abTest.variant_b : abTest.variant_a;
    
    // Run analysis with selected variant
    let result;
    if (variant.model_id) {
      result = await base44.functions.invoke('applyCustomModel', {
        model_id: variant.model_id,
        content,
        analysis_type: 'moderation'
      });
    } else {
      // Run standard analysis
      result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this content: ${content}`,
        response_json_schema: {
          type: "object",
          properties: {
            analysis: { type: "string" },
            confidence: { type: "number" }
          }
        }
      });
    }

    // Record sample for test results
    const samples = abTest.sample_analyses || [];
    samples.push({
      variant: useVariantB ? 'B' : 'A',
      timestamp: new Date().toISOString(),
      result: result.data || result,
      ground_truth
    });

    // Update test results
    const results = abTest.results || {
      variant_a_samples: 0,
      variant_b_samples: 0,
      variant_a_total_confidence: 0,
      variant_b_total_confidence: 0
    };

    if (useVariantB) {
      results.variant_b_samples = (results.variant_b_samples || 0) + 1;
      results.variant_b_total_confidence = (results.variant_b_total_confidence || 0) + (result.data?.result?.confidence || 0);
      results.variant_b_avg_confidence = results.variant_b_total_confidence / results.variant_b_samples;
    } else {
      results.variant_a_samples = (results.variant_a_samples || 0) + 1;
      results.variant_a_total_confidence = (results.variant_a_total_confidence || 0) + (result.data?.result?.confidence || 0);
      results.variant_a_avg_confidence = results.variant_a_total_confidence / results.variant_a_samples;
    }

    // Calculate statistical significance (simplified)
    if (results.variant_a_samples > 30 && results.variant_b_samples > 30) {
      const diff = Math.abs(results.variant_a_avg_confidence - results.variant_b_avg_confidence);
      results.statistical_significance = Math.min(diff * 100, 99);
      
      if (results.statistical_significance > 95) {
        results.winner = results.variant_a_avg_confidence > results.variant_b_avg_confidence ? 'A' : 'B';
      }
    }

    await base44.asServiceRole.entities.ABTest.update(test_id, {
      results,
      sample_analyses: samples.slice(-100) // Keep last 100 samples
    });

    return Response.json({ 
      success: true, 
      variant_used: useVariantB ? 'B' : 'A',
      result: result.data || result,
      current_results: results
    });
  } catch (error) {
    console.error('A/B test error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});