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

    // Get batch ID from URL
    const url = new URL(req.url);
    const batchId = url.pathname.split('/').pop();

    if (!batchId) {
      return Response.json({ error: 'Batch ID required' }, { status: 400 });
    }

    // Fetch batch job
    const batchJobs = await base44.asServiceRole.entities.BatchJob.filter({ id: batchId });
    
    if (!batchJobs || batchJobs.length === 0) {
      return Response.json({ error: 'Batch not found' }, { status: 404 });
    }

    const batchJob = batchJobs[0];

    // Verify access
    if (batchJob.user_email !== apiKeyRecord.created_by) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch batch items
    const batchItems = await base44.asServiceRole.entities.BatchItem.filter({ batch_job_id: batchId });

    // Calculate progress
    const completedItems = batchItems.filter(item => item.status === 'completed').length;
    const failedItems = batchItems.filter(item => item.status === 'failed').length;
    const pendingItems = batchItems.filter(item => item.status === 'pending').length;
    const progress = batchJob.total_items > 0 ? Math.round((completedItems / batchJob.total_items) * 100) : 0;

    // Fetch results for completed items
    const results = [];
    for (const item of batchItems) {
      if (item.result_id) {
        const resultData = await base44.asServiceRole.entities.AssessmentResult.filter({ id: item.result_id });
        if (resultData && resultData.length > 0) {
          results.push({
            item_index: item.item_index,
            status: item.status,
            result: resultData[0]
          });
        }
      } else if (item.status === 'failed') {
        results.push({
          item_index: item.item_index,
          status: 'failed',
          error: 'Processing failed'
        });
      }
    }

    return Response.json({
      success: true,
      batch: {
        id: batchJob.id,
        name: batchJob.name,
        status: batchJob.status,
        total_items: batchJob.total_items,
        completed_items: completedItems,
        failed_items: failedItems,
        pending_items: pendingItems,
        progress_percentage: progress,
        created_date: batchJob.created_date,
        summary: batchJob.summary
      },
      items: batchItems,
      results: results
    });

  } catch (error) {
    console.error('API getBatch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});