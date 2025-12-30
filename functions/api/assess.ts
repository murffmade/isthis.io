import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check API key authentication
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keys = await base44.asServiceRole.entities.APIKey.filter({ api_key: keyHash, is_active: true });
    
    if (!keys || keys.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const apiKeyRecord = keys[0];

    // Update usage stats
    await base44.asServiceRole.entities.APIKey.update(apiKeyRecord.id, {
      last_used: new Date().toISOString(),
      usage_count: (apiKeyRecord.usage_count || 0) + 1
    });

    const { text, context, store_raw_text, comparative_mode, baseline_text } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Hash input text
    const textHash = crypto.createHash('sha256').update(text).digest('hex');

    // Create assessment
    const assessment = await base44.asServiceRole.entities.Assessment.create({
      user_email: apiKeyRecord.created_by,
      input_text_hash: textHash,
      input_text_encrypted: store_raw_text ? text : null,
      store_raw_text: store_raw_text || false,
      content_type: 'text',
      context: context || {},
      comparative_mode: comparative_mode || false,
      baseline_text_hash: baseline_text ? crypto.createHash('sha256').update(baseline_text).digest('hex') : null
    });

    // Run analysis (invoke internal assessment function)
    const analysisResult = await base44.functions.invoke('runAssessment', {
      text,
      context,
      storeRawText: store_raw_text,
      comparativeMode: comparative_mode,
      baselineText: baseline_text
    });

    // Trigger webhook notification
    try {
      await base44.functions.invoke('triggerWebhook', {
        event: 'assessment.completed',
        data: {
          assessment_id: assessment.id,
          result: analysisResult.data
        },
        user_email: apiKeyRecord.created_by
      });
    } catch (webhookError) {
      console.warn('Webhook trigger failed:', webhookError);
    }

    return Response.json({
      success: true,
      assessment_id: assessment.id,
      result: analysisResult.data
    });

  } catch (error) {
    console.error('API assess error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});