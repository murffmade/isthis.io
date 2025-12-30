import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model_id, content, analysis_type } = await req.json();
    
    if (!model_id || !content) {
      return Response.json({ error: 'model_id and content are required' }, { status: 400 });
    }

    // Fetch custom model configuration
    const models = await base44.entities.CustomAIModel.filter({ id: model_id, active: true });
    if (models.length === 0) {
      return Response.json({ error: 'Custom model not found or inactive' }, { status: 404 });
    }
    
    const customModel = models[0];

    // Build enhanced prompt with custom instructions
    let enhancedPrompt = `${customModel.custom_instructions || ''}\n\n`;
    
    if (customModel.industry_focus && customModel.industry_focus !== 'general') {
      enhancedPrompt += `INDUSTRY CONTEXT: This analysis is for ${customModel.industry_focus} industry content. Apply industry-specific standards and regulations.\n\n`;
    }

    // Add training examples as few-shot learning
    if (customModel.training_data && customModel.training_data.length > 0) {
      enhancedPrompt += `TRAINING EXAMPLES:\n`;
      customModel.training_data.slice(0, 3).forEach(example => {
        enhancedPrompt += `Input: ${example.input}\nExpected: ${example.expected_output}\n\n`;
      });
    }

    enhancedPrompt += `Now analyze this content:\n${content}`;

    // Call LLM with custom configuration
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: enhancedPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          analysis: { type: "string" },
          confidence: { type: "number" },
          detected_issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                severity: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          recommendation: { type: "string" }
        }
      }
    });

    // Apply detection priority weights
    if (customModel.detection_priorities) {
      result.weighted_score = result.confidence * (customModel.detection_priorities[`${analysis_type}_weight`] || 1);
    }

    // Track model performance
    await base44.entities.CustomAIModel.update(model_id, {
      performance_metrics: {
        ...customModel.performance_metrics,
        total_analyses: (customModel.performance_metrics?.total_analyses || 0) + 1,
        last_used: new Date().toISOString()
      }
    });

    return Response.json({ success: true, result, model_used: customModel.model_name });
  } catch (error) {
    console.error('Custom model error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});