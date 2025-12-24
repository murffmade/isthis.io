import { base44 } from '@/api/base44Client';

/**
 * Utility functions to create notifications for various events
 */

export async function notifyInfluencerClick(influencerEmail, influencerCode) {
  try {
    await base44.entities.Notification.create({
      user_email: influencerEmail,
      type: 'click',
      title: 'New Click on Your Link! 🎯',
      message: 'Someone just clicked your influencer link. Great job spreading the word!',
      action_url: '/InfluencerDashboard'
    });
  } catch (error) {
    console.error('Failed to send click notification:', error);
  }
}

export async function notifyInfluencerConversion(influencerEmail, amount) {
  try {
    await base44.entities.Notification.create({
      user_email: influencerEmail,
      type: 'conversion',
      title: 'New Conversion! 💰',
      message: `You just earned a commission! A user subscribed through your link.`,
      data: { amount: (amount * 0.3).toFixed(2) },
      action_url: '/InfluencerDashboard'
    });
  } catch (error) {
    console.error('Failed to send conversion notification:', error);
  }
}

export async function notifyPayoutPending(influencerEmail, amount) {
  try {
    await base44.entities.Notification.create({
      user_email: influencerEmail,
      type: 'payout_pending',
      title: 'Payout Scheduled ⏰',
      message: `Your payout of $${amount.toFixed(2)} is scheduled to be processed.`,
      data: { amount: amount.toFixed(2) }
    });
  } catch (error) {
    console.error('Failed to send payout pending notification:', error);
  }
}

export async function notifyPayoutProcessed(influencerEmail, amount) {
  try {
    await base44.entities.Notification.create({
      user_email: influencerEmail,
      type: 'payout_processed',
      title: 'Payout Processed! ✅',
      message: `Your payout of $${amount.toFixed(2)} has been sent to your payment email.`,
      data: { amount: amount.toFixed(2) }
    });
  } catch (error) {
    console.error('Failed to send payout processed notification:', error);
  }
}

// Affiliate-specific notifications
export async function notifyAffiliateClick(affiliateEmail, affiliateCode) {
  try {
    // In-app notification
    await base44.entities.Notification.create({
      user_email: affiliateEmail,
      type: 'click',
      title: 'New Click on Your Link! 🎯',
      message: 'Someone just clicked your affiliate link. Great job spreading the word!',
      action_url: '/AffiliateDashboard'
    });

    // Email notification
    await base44.integrations.Core.SendEmail({
      to: affiliateEmail,
      subject: '🎯 New Click on Your Affiliate Link!',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">New Click Detected!</h2>
          <p>Great news! Someone just clicked your affiliate link.</p>
          <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            <strong>Your Affiliate Code:</strong> ${affiliateCode}
          </p>
          <p>Keep sharing your link to earn more commissions!</p>
          <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/AffiliateDashboard" 
             style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; margin-top: 10px;">
            View Dashboard
          </a>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send affiliate click notification:', error);
  }
}

export async function notifyAffiliateConversion(affiliateEmail, amount, affiliateCode) {
  try {
    const commission = (amount * 0.3).toFixed(2);
    
    // In-app notification
    await base44.entities.Notification.create({
      user_email: affiliateEmail,
      type: 'conversion',
      title: 'New Conversion! 💰',
      message: `You just earned $${commission}! A user subscribed through your link.`,
      data: { amount: commission },
      action_url: '/AffiliateDashboard'
    });

    // Email notification
    await base44.integrations.Core.SendEmail({
      to: affiliateEmail,
      subject: '💰 New Conversion - You Earned a Commission!',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Congratulations! 🎉</h2>
          <p>A user just converted through your affiliate link!</p>
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <div style="font-size: 14px; color: #047857; margin-bottom: 5px;">You Earned</div>
            <div style="font-size: 36px; font-weight: bold; color: #047857;">$${commission}</div>
            <div style="font-size: 14px; color: #047857; margin-top: 5px;">30% Commission</div>
          </div>
          <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            <strong>Your Affiliate Code:</strong> ${affiliateCode}<br>
            <strong>Sale Amount:</strong> $${amount.toFixed(2)}
          </p>
          <p>Keep sharing to earn more! Your commission will be included in your next payout.</p>
          <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/AffiliateDashboard" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; margin-top: 10px;">
            View Dashboard
          </a>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send affiliate conversion notification:', error);
  }
}