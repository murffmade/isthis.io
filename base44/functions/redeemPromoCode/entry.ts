import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return Response.json({ 
        success: false, 
        message: 'This promo code is not valid.' 
      });
    }

    // Normalize code
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();

    // Look up promo code
    const promoCodes = await base44.asServiceRole.entities.PromoCode.filter({ 
      code: normalizedCode 
    });

    if (promoCodes.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'This promo code is not valid.' 
      });
    }

    const promoCode = promoCodes[0];

    // Validate status
    if (promoCode.status !== 'active') {
      return Response.json({ 
        success: false, 
        message: 'This promo code is no longer active.' 
      });
    }

    // Validate date range
    if (promoCode.start_date && new Date(promoCode.start_date) > now) {
      return Response.json({ 
        success: false, 
        message: 'This promo code is no longer active.' 
      });
    }

    if (promoCode.end_date && new Date(promoCode.end_date) < now) {
      return Response.json({ 
        success: false, 
        message: 'This promo code is no longer active.' 
      });
    }

    // Count total redemptions
    const allRedemptions = await base44.asServiceRole.entities.PromoRedemption.filter({ 
      promo_code_id: promoCode.id 
    });

    if (promoCode.max_redemptions_total && allRedemptions.length >= promoCode.max_redemptions_total) {
      return Response.json({ 
        success: false, 
        message: 'This promo code is no longer active.' 
      });
    }

    // Count per-account redemptions
    const userRedemptions = allRedemptions.filter(r => r.redeemed_by_user_id === user.id);
    if (userRedemptions.length >= (promoCode.max_redemptions_per_account || 1)) {
      return Response.json({ 
        success: false, 
        message: 'This promo code has already been used on this account.' 
      });
    }

    // Apply benefits
    const appliedBenefits = {
      subscription: null,
      gifts: []
    };

    const benefitPayload = promoCode.benefit_payload || {};

    // Apply subscription grant
    if (benefitPayload.subscription_grant) {
      const { plan, months } = benefitPayload.subscription_grant;
      const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
        created_by: user.email 
      });

      let subscriptionAction = 'created';
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (months || 12));

      if (existingSubscriptions.length > 0) {
        const subscription = existingSubscriptions[0];
        
        // Don't downgrade lifetime
        if (subscription.plan === 'lifetime') {
          appliedBenefits.subscription = {
            plan: 'lifetime',
            expires_at: null,
            action: 'no_change'
          };
        } else {
          // Upgrade/extend to annual
          let newExpiresAt = expiresAt;
          if (subscription.plan === 'annual' && subscription.expires_at) {
            const currentExpiry = new Date(subscription.expires_at);
            if (currentExpiry > now) {
              newExpiresAt = new Date(currentExpiry);
              newExpiresAt.setMonth(newExpiresAt.getMonth() + (months || 12));
            }
          }

          await base44.asServiceRole.entities.Subscription.update(subscription.id, {
            plan: plan,
            status: 'active',
            expires_at: newExpiresAt.toISOString()
          });

          subscriptionAction = subscription.plan === 'annual' ? 'extended' : 'upgraded';
          appliedBenefits.subscription = {
            plan: plan,
            expires_at: newExpiresAt.toISOString(),
            action: subscriptionAction
          };
        }
      } else {
        // Create new subscription
        await base44.asServiceRole.entities.Subscription.create({
          user_email: user.email,
          plan: plan,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          granted_by_admin: true
        });

        appliedBenefits.subscription = {
          plan: plan,
          expires_at: expiresAt.toISOString(),
          action: 'created'
        };
      }
    }

    // Issue gift codes
    const createdGiftCodeIds = [];
    if (benefitPayload.gift_entitlement) {
      const { plan, quantity } = benefitPayload.gift_entitlement;
      const giftQuantity = quantity || 1;
      const giftExpiresAt = new Date();
      giftExpiresAt.setDate(giftExpiresAt.getDate() + 90);

      for (let i = 0; i < giftQuantity; i++) {
        const giftCode = `${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        
        const gift = await base44.asServiceRole.entities.GiftCode.create({
          code: giftCode,
          plan: plan,
          sender_email: user.email,
          sender_name: user.full_name || user.email,
          recipient_name: '',
          message: '',
          theme: 'default',
          redeemed: false,
          expires_at: giftExpiresAt.toISOString(),
          stripe_payment_intent_id: `promo:${promoCode.id}`
        });

        createdGiftCodeIds.push(gift.id);
        appliedBenefits.gifts.push({
          id: gift.id,
          code: gift.code,
          plan: plan,
          expires_at: giftExpiresAt.toISOString()
        });
      }
    }

    // Create redemption record
    await base44.asServiceRole.entities.PromoRedemption.create({
      promo_code_id: promoCode.id,
      redeemed_by_user_id: user.id,
      redeemed_by_email: user.email,
      affiliate_partner_id: promoCode.affiliate_partner_id || null,
      gift_code_ids: createdGiftCodeIds,
      notes: `Redeemed by ${user.email}`
    });

    // Update affiliate partner earnings if applicable
    if (promoCode.affiliate_partner_id) {
      try {
        const affiliates = await base44.asServiceRole.entities.AffiliatePartner.filter({ 
          id: promoCode.affiliate_partner_id 
        });
        
        if (affiliates.length > 0) {
          const affiliate = affiliates[0];
          const commissionRate = affiliate.commission_rate || 30;
          
          // Calculate commission based on plan value
          let conversionValue = 0;
          if (appliedBenefits.subscription) {
            if (appliedBenefits.subscription.plan === 'annual') {
              conversionValue = 29;
            } else if (appliedBenefits.subscription.plan === 'lifetime') {
              conversionValue = 99;
            }
          }
          
          const commission = (conversionValue * commissionRate) / 100;
          
          // Update affiliate stats
          await base44.asServiceRole.entities.AffiliatePartner.update(affiliate.id, {
            total_conversions: (affiliate.total_conversions || 0) + 1,
            total_earnings: (affiliate.total_earnings || 0) + commission,
            pending_payout: (affiliate.pending_payout || 0) + commission
          });
        }
      } catch (error) {
        console.error('Failed to update affiliate earnings:', error);
        // Don't fail the redemption if affiliate update fails
      }
    }

    return Response.json({
      success: true,
      message: 'Promo code applied successfully!',
      applied: appliedBenefits
    });

  } catch (error) {
    console.error('Promo redemption error:', error);
    return Response.json({ 
      success: false, 
      message: 'This promo code could not be applied.' 
    }, { status: 500 });
  }
});