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