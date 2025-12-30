import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisData } = await req.json();
    
    if (!analysisData) {
      return Response.json({ error: 'Analysis data is required' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Summarize this content analysis report into a clear, actionable format:

${JSON.stringify(analysisData, null, 2)}

Create a concise executive summary that includes:
1. Key Findings (top 3-5 most important discoveries)
2. Risk Assessment (critical/high/medium/low with specific risks)
3. Confidence Level (how reliable is this analysis)
4. Recommended Actions (what should be done)
5. Red Flags (immediate concerns that need attention)

Focus on clarity and actionability.`,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          key_findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                finding: { type: "string" },
                importance: { type: "string", enum: ["critical", "high", "medium", "low"] },
                details: { type: "string" }
              }
            }
          },
          risk_assessment: {
            type: "object",
            properties: {
              overall_risk: { type: "string", enum: ["critical", "high", "medium", "low"] },
              specific_risks: { type: "array", items: { type: "string" } }
            }
          },
          confidence_level: { 
            type: "string", 
            enum: ["very_high", "high", "moderate", "low"] 
          },
          recommended_actions: { type: "array", items: { type: "string" } },
          red_flags: { type: "array", items: { type: "string" } },
          additional_notes: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, summary: result });
  } catch (error) {
    console.error('Summarization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});