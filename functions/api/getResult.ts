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

    // Get result ID from URL
    const url = new URL(req.url);
    const resultId = url.pathname.split('/').pop();

    if (!resultId) {
      return Response.json({ error: 'Result ID required' }, { status: 400 });
    }

    // Fetch result
    const results = await base44.asServiceRole.entities.AssessmentResult.filter({ id: resultId });
    
    if (!results || results.length === 0) {
      return Response.json({ error: 'Result not found' }, { status: 404 });
    }

    const result = results[0];

    // Fetch associated assessment
    const assessments = await base44.asServiceRole.entities.Assessment.filter({ id: result.assessment_id });
    const assessment = assessments[0];

    // Verify access (result belongs to API key owner)
    if (assessment.user_email !== apiKeyRecord.created_by) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    return Response.json({
      success: true,
      result: result,
      assessment: {
        id: assessment.id,
        created_date: assessment.created_date,
        context: assessment.context,
        content_type: assessment.content_type
      }
    });

  } catch (error) {
    console.error('API getResult error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});