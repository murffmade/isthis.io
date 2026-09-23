import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { flagged_content_id, decision, admin_notes, ai_feedback } = await req.json();
    
    if (!flagged_content_id || !decision) {
      return Response.json({ error: 'flagged_content_id and decision are required' }, { status: 400 });
    }

    // Update flagged content with admin decision
    await base44.asServiceRole.entities.FlaggedContent.update(flagged_content_id, {
      admin_decision: decision,
      admin_notes,
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'under_review'
    });

    // If feedback provided, save it for model improvement
    if (ai_feedback) {
      await base44.asServiceRole.entities.TrainingFeedback.create({
        content_type: 'moderation',
        feedback_type: ai_feedback.correct ? 'correct' : 'incorrect',
        user_email: user.email,
        original_prediction: ai_feedback.ai_decision,
        correct_label: decision,
        confidence: ai_feedback.confidence || 0,
        notes: ai_feedback.notes || admin_notes,
        metadata: {
          flagged_content_id,
          violations: ai_feedback.violations
        }
      });
    }

    // Log audit trail
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action: 'moderation_decision',
      resource_type: 'FlaggedContent',
      resource_id: flagged_content_id,
      details: {
        decision,
        admin_notes,
        has_feedback: !!ai_feedback
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Moderation decision error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});