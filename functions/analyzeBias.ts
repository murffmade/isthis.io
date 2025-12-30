import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json();
    
    if (!content) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following content for potential biases. Identify:
1. Political bias (left/right/neutral)
2. Cultural bias
3. Gender bias
4. Confirmation bias
5. Emotional language bias

Content:
${content}

Provide a structured analysis with:
- Overall bias score (0-100, where 0 is completely neutral)
- Detected biases with specific examples
- Bias type classification
- Recommendations for more neutral language`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          bias_level: { type: "string", enum: ["low", "moderate", "high"] },
          detected_biases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                severity: { type: "string" },
                example: { type: "string" },
                explanation: { type: "string" }
              }
            }
          },
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ success: true, analysis: result });
  } catch (error) {
    console.error('Bias analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});