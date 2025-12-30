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

    const { name, items, context } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Items array required' }, { status: 400 });
    }

    // Create batch job
    const batchJob = await base44.asServiceRole.entities.BatchJob.create({
      user_email: apiKeyRecord.created_by,
      name: name || `Batch ${new Date().toISOString()}`,
      status: 'processing',
      total_items: items.length,
      completed_items: 0
    });

    // Process items asynchronously
    const batchItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        // Create assessment
        const textHash = crypto.createHash('sha256').update(item.text).digest('hex');
        const assessment = await base44.asServiceRole.entities.Assessment.create({
          user_email: apiKeyRecord.created_by,
          input_text_hash: textHash,
          content_type: 'text',
          context: { ...context, ...item.context }
        });

        // Run analysis
        const analysisResult = await base44.functions.invoke('runAssessment', {
          text: item.text,
          context: { ...context, ...item.context }
        });

        // Create batch item
        const batchItem = await base44.asServiceRole.entities.BatchItem.create({
          batch_job_id: batchJob.id,
          assessment_id: assessment.id,
          result_id: analysisResult.data.result_id,
          item_index: i,
          status: 'completed'
        });

        batchItems.push(batchItem);
      } catch (error) {
        console.error(`Error processing item ${i}:`, error);
        await base44.asServiceRole.entities.BatchItem.create({
          batch_job_id: batchJob.id,
          item_index: i,
          status: 'failed'
        });
      }
    }

    // Update batch job status
    await base44.asServiceRole.entities.BatchJob.update(batchJob.id, {
      status: 'completed',
      completed_items: batchItems.length
    });

    return Response.json({
      success: true,
      batch_id: batchJob.id,
      total_items: items.length,
      completed_items: batchItems.length,
      status: 'completed'
    });

  } catch (error) {
    console.error('API createBatch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});