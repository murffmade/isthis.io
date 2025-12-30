import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';
import { jsPDF } from 'npm:jspdf@2.5.1';

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

    const { result_id, format = 'json' } = await req.json();

    if (!result_id) {
      return Response.json({ error: 'Result ID required' }, { status: 400 });
    }

    if (!['json', 'pdf'].includes(format)) {
      return Response.json({ error: 'Format must be json or pdf' }, { status: 400 });
    }

    // Fetch result
    const results = await base44.asServiceRole.entities.AssessmentResult.filter({ id: result_id });
    
    if (!results || results.length === 0) {
      return Response.json({ error: 'Result not found' }, { status: 404 });
    }

    const result = results[0];

    // Fetch associated assessment
    const assessments = await base44.asServiceRole.entities.Assessment.filter({ id: result.assessment_id });
    const assessment = assessments[0];

    // Verify access
    if (assessment.user_email !== apiKeyRecord.created_by) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate report
    if (format === 'json') {
      const report = {
        report_type: 'assessment_audit',
        generated_at: new Date().toISOString(),
        assessment: {
          id: assessment.id,
          created_date: assessment.created_date,
          context: assessment.context,
          content_type: assessment.content_type
        },
        result: {
          id: result.id,
          risk_level: result.risk_level,
          likelihood_range: `${result.likelihood_min}-${result.likelihood_max}%`,
          meta_confidence: result.meta_confidence,
          engine_version: result.engine_version,
          scoring_version: result.scoring_version,
          narrative_explanation: result.narrative_explanation,
          signals: result.signals,
          key_findings: result.key_findings,
          interpretation_notes: result.interpretation_notes
        },
        disclaimer: 'This assessment is probabilistic and not definitive. Results should be interpreted in context.'
      };

      return Response.json(report);
    } else {
      // Generate PDF
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text('AI-Origin Risk Assessment Report', 20, 20);

      // Metadata
      doc.setFontSize(10);
      doc.text(`Report Generated: ${new Date().toISOString()}`, 20, 30);
      doc.text(`Assessment ID: ${assessment.id}`, 20, 35);
      doc.text(`Date Assessed: ${assessment.created_date}`, 20, 40);

      // Risk Level
      doc.setFontSize(14);
      doc.text('Risk Assessment', 20, 50);
      doc.setFontSize(12);
      doc.text(`Risk Level: ${result.risk_level}`, 20, 58);
      doc.text(`AI Likelihood: ${result.likelihood_min}-${result.likelihood_max}%`, 20, 65);
      doc.text(`Confidence: ${result.meta_confidence}`, 20, 72);

      // Narrative
      doc.setFontSize(14);
      doc.text('Analysis', 20, 85);
      doc.setFontSize(10);
      const splitNarrative = doc.splitTextToSize(result.narrative_explanation || 'No explanation provided', 170);
      doc.text(splitNarrative, 20, 93);

      // Signals
      let y = 93 + (splitNarrative.length * 5) + 10;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Detection Signals', 20, y);
      y += 8;

      doc.setFontSize(10);
      if (result.signals && result.signals.length > 0) {
        result.signals.slice(0, 10).forEach((signal, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${idx + 1}. ${signal.name}: ${signal.score}`, 25, y);
          y += 5;
          const explanation = doc.splitTextToSize(signal.explanation || '', 160);
          doc.text(explanation, 30, y);
          y += explanation.length * 4 + 3;
        });
      }

      // Disclaimer
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      y += 10;
      doc.setFontSize(8);
      doc.text('Disclaimer: This assessment is probabilistic and not definitive.', 20, y);
      doc.text('Results should be interpreted in context with domain expertise.', 20, y + 5);

      const pdfBytes = doc.output('arraybuffer');

      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="assessment-${result_id}.pdf"`
        }
      });
    }

  } catch (error) {
    console.error('API generateReport error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});