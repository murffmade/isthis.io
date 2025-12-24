import { base44 } from '@/api/base44Client';

/**
 * AI-powered content moderation utility
 * Analyzes content for inappropriate material and flags for review
 */

export async function moderateImage(imageUrl, contentId = null) {
  try {
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI content moderator. Analyze this image for inappropriate content including:
- Nudity or sexually explicit content
- Violence or gore
- Hate symbols or hate speech
- Spam or misleading content
- Other inappropriate material

Provide:
1. A flag_reason (nudity, violence, hate_speech, spam, inappropriate, or "safe" if clean)
2. A confidence_score (0-100)
3. A brief explanation
4. Whether it should be flagged for review (flag_for_review: true/false)`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          flag_reason: { type: "string" },
          confidence_score: { type: "number" },
          explanation: { type: "string" },
          flag_for_review: { type: "boolean" },
          specific_concerns: { type: "array", items: { type: "string" } }
        }
      }
    });

    // If flagged, create a record
    if (analysis.flag_for_review && analysis.flag_reason !== 'safe') {
      await base44.entities.FlaggedContent.create({
        content_type: 'image',
        content_id: contentId,
        content_url: imageUrl,
        flag_reason: analysis.flag_reason,
        confidence_score: analysis.confidence_score,
        ai_analysis: analysis,
        status: 'pending'
      });
    }

    return analysis;
  } catch (error) {
    console.error('Content moderation failed:', error);
    return null;
  }
}

export async function moderateVideo(videoUrl, contentId = null) {
  try {
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI content moderator. Analyze this video for inappropriate content including:
- Nudity or sexually explicit content
- Violence or gore
- Hate speech or discrimination
- Spam or misleading content
- Other inappropriate material

Provide:
1. A flag_reason (nudity, violence, hate_speech, spam, inappropriate, or "safe" if clean)
2. A confidence_score (0-100)
3. A brief explanation
4. Whether it should be flagged for review (flag_for_review: true/false)`,
      file_urls: [videoUrl],
      response_json_schema: {
        type: "object",
        properties: {
          flag_reason: { type: "string" },
          confidence_score: { type: "number" },
          explanation: { type: "string" },
          flag_for_review: { type: "boolean" },
          specific_concerns: { type: "array", items: { type: "string" } }
        }
      }
    });

    if (analysis.flag_for_review && analysis.flag_reason !== 'safe') {
      await base44.entities.FlaggedContent.create({
        content_type: 'video',
        content_id: contentId,
        content_url: videoUrl,
        flag_reason: analysis.flag_reason,
        confidence_score: analysis.confidence_score,
        ai_analysis: analysis,
        status: 'pending'
      });
    }

    return analysis;
  } catch (error) {
    console.error('Video moderation failed:', error);
    return null;
  }
}

export async function moderateText(text, contentType, contentId = null) {
  try {
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI content moderator. Analyze this text for inappropriate content including:
- Hate speech or discrimination
- Harassment or bullying
- Spam or scams
- Explicit sexual content
- Violence or threats
- Misinformation
- Other policy violations

Text to analyze: "${text}"

Provide:
1. A flag_reason (hate_speech, spam, inappropriate, or "safe" if clean)
2. A confidence_score (0-100)
3. A brief explanation
4. Whether it should be flagged for review (flag_for_review: true/false)`,
      response_json_schema: {
        type: "object",
        properties: {
          flag_reason: { type: "string" },
          confidence_score: { type: "number" },
          explanation: { type: "string" },
          flag_for_review: { type: "boolean" },
          specific_concerns: { type: "array", items: { type: "string" } }
        }
      }
    });

    if (analysis.flag_for_review && analysis.flag_reason !== 'safe') {
      await base44.entities.FlaggedContent.create({
        content_type: contentType,
        content_id: contentId,
        content_preview: text.substring(0, 200),
        flag_reason: analysis.flag_reason,
        confidence_score: analysis.confidence_score,
        ai_analysis: analysis,
        status: 'pending'
      });
    }

    return analysis;
  } catch (error) {
    console.error('Text moderation failed:', error);
    return null;
  }
}