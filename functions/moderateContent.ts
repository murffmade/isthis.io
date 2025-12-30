import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, content_type } = await req.json();
    
    if (!file_url) {
      return Response.json({ error: 'File URL is required' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this ${content_type || 'content'} for community guideline violations.

Check for:
1. Hate Speech - targeting race, religion, gender, sexual orientation, disability
2. Explicit/Adult Content - nudity, sexual content, pornography
3. Violence/Gore - graphic violence, blood, injuries, weapons
4. Illegal Activities - drugs, weapons sales, criminal activity
5. Harassment/Bullying - targeted harassment, doxxing, threats
6. Self-Harm - suicide, eating disorders, self-injury
7. Spam/Scam - commercial spam, phishing, fraud
8. Misinformation - dangerous health misinformation, conspiracy theories

Provide a detailed moderation report with specific violations found and confidence level.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          safe: { type: "boolean" },
          action: { 
            type: "string", 
            enum: ["approve", "flag", "reject"] 
          },
          overall_risk: { 
            type: "string", 
            enum: ["none", "low", "medium", "high", "critical"] 
          },
          violations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                confidence: { type: "number" },
                description: { type: "string" },
                specific_elements: { type: "array", items: { type: "string" } }
              }
            }
          },
          reasons: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Log moderation event
    if (!result.safe || result.action !== 'approve') {
      await base44.entities.FlaggedContent.create({
        user_email: user.email,
        file_url,
        content_type: content_type || 'unknown',
        moderation_result: result,
        status: result.action === 'reject' ? 'blocked' : 'flagged',
        flagged_reason: result.reasons?.join(', ') || 'Policy violation detected'
      });
    }

    return Response.json({ success: true, moderation: result });
  } catch (error) {
    console.error('Content moderation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});