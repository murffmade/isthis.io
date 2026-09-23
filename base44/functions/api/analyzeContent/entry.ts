import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // API Key authentication (no user session required)
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return Response.json({ 
        error: 'API key required',
        message: 'Include your API key in the x-api-key header or Authorization: Bearer header'
      }, { status: 401 });
    }

    // Initialize SDK with service role for API key validation
    const base44 = createClientFromRequest(req);
    
    // Validate API key and get owner
    const apiKeys = await base44.asServiceRole.entities.APIKey.filter({ api_key: apiKey });
    
    if (apiKeys.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const keyRecord = apiKeys[0];
    
    if (!keyRecord.is_active) {
      return Response.json({ error: 'API key is inactive' }, { status: 401 });
    }

    // Check if user has enterprise subscription
    const entitlements = await base44.asServiceRole.entities.UserEntitlement.filter({ 
      user_email: keyRecord.created_by 
    });
    
    const hasEnterprise = entitlements.some(e => 
      e.status === 'active' && (e.plan_key === 'lifetime' || e.plan_key === 'annual')
    );

    if (!hasEnterprise) {
      return Response.json({ 
        error: 'Enterprise subscription required',
        message: 'External API access requires an active Premium subscription'
      }, { status: 403 });
    }

    // Parse request
    const { 
      content_type, 
      content, 
      file_url, 
      analysis_types = ['moderation', 'bias', 'sentiment']
    } = await req.json();

    if (!content_type || (!content && !file_url)) {
      return Response.json({ 
        error: 'Missing required fields',
        message: 'content_type and either content (text) or file_url (image/video) required'
      }, { status: 400 });
    }

    // Validate analysis types
    const validTypes = ['moderation', 'bias', 'sentiment', 'summary'];
    const requestedTypes = analysis_types.filter(t => validTypes.includes(t));

    if (requestedTypes.length === 0) {
      return Response.json({
        error: 'Invalid analysis_types',
        message: `analysis_types must include at least one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    const results = {};
    let overallRiskScore = 0;
    const violations = [];

    // Content Moderation Analysis
    if (requestedTypes.includes('moderation')) {
      const moderationPrompt = `Analyze this content for community guideline violations:

Content Type: ${content_type}
${content ? `Text Content: ${content}` : `File URL: ${file_url}`}

Evaluate for:
1. Nudity/Sexual content
2. Violence/Gore
3. Hate speech/Discrimination
4. Harassment/Bullying
5. Profanity/Offensive language
6. Misinformation/Scams
7. Copyright violations

For each category, provide:
- Risk score (0-100)
- Violation detected (yes/no)
- Severity (none/low/medium/high/critical)
- Specific violations found
- Recommended action (approve/flag/reject)`;

      const moderationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: moderationPrompt,
        file_urls: file_url ? [file_url] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            overall_risk: { type: "number" },
            overall_action: { type: "string", enum: ["approve", "flag", "reject"] },
            categories: {
              type: "object",
              properties: {
                nudity: {
                  type: "object",
                  properties: {
                    risk_score: { type: "number" },
                    detected: { type: "boolean" },
                    severity: { type: "string" },
                    details: { type: "string" }
                  }
                },
                violence: {
                  type: "object",
                  properties: {
                    risk_score: { type: "number" },
                    detected: { type: "boolean" },
                    severity: { type: "string" },
                    details: { type: "string" }
                  }
                },
                hate_speech: {
                  type: "object",
                  properties: {
                    risk_score: { type: "number" },
                    detected: { type: "boolean" },
                    severity: { type: "string" },
                    details: { type: "string" }
                  }
                },
                harassment: {
                  type: "object",
                  properties: {
                    risk_score: { type: "number" },
                    detected: { type: "boolean" },
                    severity: { type: "string" },
                    details: { type: "string" }
                  }
                },
                profanity: {
                  type: "object",
                  properties: {
                    risk_score: { type: "number" },
                    detected: { type: "boolean" },
                    severity: { type: "string" },
                    details: { type: "string" }
                  }
                },
                misinformation: {
                  type: "object",
                  properties: {
                    risk_score: { type: "number" },
                    detected: { type: "boolean" },
                    severity: { type: "string" },
                    details: { type: "string" }
                  }
                }
              }
            },
            violations_summary: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      results.moderation = moderationResult;
      overallRiskScore = Math.max(overallRiskScore, moderationResult.overall_risk);
      
      if (moderationResult.violations_summary) {
        violations.push(...moderationResult.violations_summary);
      }
    }

    // Bias Analysis
    if (requestedTypes.includes('bias') && content) {
      const biasResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analyze this text for various types of bias:

"${content}"

Identify:
1. Political bias (left/right/neutral)
2. Cultural/ethnic bias
3. Gender bias
4. Age bias
5. Socioeconomic bias
6. Confirmation bias

For each bias type, provide:
- Detected (yes/no)
- Severity (0-100)
- Specific examples
- Impact assessment`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_bias_score: { type: "number" },
            bias_types: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  detected: { type: "boolean" },
                  severity: { type: "number" },
                  examples: { type: "array", items: { type: "string" } },
                  impact: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      results.bias = biasResult;
      overallRiskScore = Math.max(overallRiskScore, biasResult.overall_bias_score);
    }

    // Sentiment Analysis
    if (requestedTypes.includes('sentiment') && content) {
      const sentimentResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Perform advanced sentiment and tone analysis on this text:

"${content}"

Analyze:
1. Overall sentiment (positive/negative/neutral)
2. Emotional tone
3. Sentiment intensity (0-100)
4. Sarcasm/irony detection
5. Subtext analysis
6. Audience perception`,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
            sentiment_score: { type: "number" },
            emotional_tone: { type: "array", items: { type: "string" } },
            intensity: { type: "number" },
            sarcasm_detected: { type: "boolean" },
            subtext: { type: "string" },
            audience_perception: { type: "string" }
          }
        }
      });

      results.sentiment = sentimentResult;
    }

    // Summary Generation
    if (requestedTypes.includes('summary') && content) {
      const summaryResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive summary of this content:

"${content}"

Provide:
1. Brief summary (2-3 sentences)
2. Key points (bullet list)
3. Main themes
4. Notable quotes or statements
5. Overall assessment`,
        response_json_schema: {
          type: "object",
          properties: {
            brief_summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            themes: { type: "array", items: { type: "string" } },
            notable_quotes: { type: "array", items: { type: "string" } },
            assessment: { type: "string" }
          }
        }
      });

      results.summary = summaryResult;
    }

    // Update API key usage
    await base44.asServiceRole.entities.APIKey.update(keyRecord.id, {
      usage_count: (keyRecord.usage_count || 0) + 1,
      last_used: new Date().toISOString()
    });

    // Return comprehensive results
    return Response.json({
      success: true,
      analysis_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      content_type,
      analyses_performed: requestedTypes,
      overall_risk_score: overallRiskScore,
      violations: violations.length > 0 ? violations : null,
      results,
      metadata: {
        api_version: "1.0",
        processing_time_ms: Date.now()
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ 
      error: 'Analysis failed',
      message: error.message 
    }, { status: 500 });
  }
});