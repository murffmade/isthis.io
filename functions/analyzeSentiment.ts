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
      prompt: `Perform advanced sentiment and tone analysis on this content:

${content}

Detect:
1. Primary sentiment (positive/negative/neutral/mixed)
2. Sarcasm indicators and confidence level
3. Emotional tone (angry, joyful, fearful, sad, etc.)
4. Subtext and implied meaning
5. Irony detection
6. Passive-aggressive patterns

Provide nuanced analysis that goes beyond surface-level sentiment.`,
      response_json_schema: {
        type: "object",
        properties: {
          primary_sentiment: { 
            type: "string", 
            enum: ["positive", "negative", "neutral", "mixed"] 
          },
          sentiment_score: { type: "number" },
          sarcasm_detected: { type: "boolean" },
          sarcasm_confidence: { type: "number" },
          sarcasm_indicators: { type: "array", items: { type: "string" } },
          emotional_tones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                emotion: { type: "string" },
                intensity: { type: "string" },
                evidence: { type: "string" }
              }
            }
          },
          irony_detected: { type: "boolean" },
          subtext: { type: "string" },
          passive_aggressive: { type: "boolean" },
          overall_analysis: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, analysis: result });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});