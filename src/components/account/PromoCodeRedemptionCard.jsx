import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function PromoCodeRedemptionCard() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('redeemPromoCode', { 
        code: code.trim() 
      });

      if (response.data.success) {
        setResult({ 
          success: true, 
          applied: response.data.applied 
        });
        setCode('');
        toast.success('Promo code applied successfully!');
      } else {
        setResult({ 
          success: false, 
          message: response.data.message 
        });
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Redemption error:', error);
      setResult({ 
        success: false, 
        message: 'This promo code could not be applied.' 
      });
      toast.error('Failed to apply promo code');
    } finally {
      setLoading(false);
    }
  };

  const handleSendGift = (giftId) => {
    navigate(createPageUrl('MyGifts') + '?highlight=' + giftId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo Code</CardTitle>
        <CardDescription>
          Promo codes aren't case-sensitive. Some can only be used once per account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter promo code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !code.trim()}>
              {loading ? 'Redeeming...' : 'Redeem'}
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  {result.success ? (
                    <div className="space-y-3">
                      {result.applied.subscription && (
                        <p className="text-sm text-slate-700">
                          <strong>Subscription {
                            result.applied.subscription.action === 'extended' ? 'extended' :
                            result.applied.subscription.action === 'upgraded' ? 'updated' :
                            result.applied.subscription.action === 'created' ? 'activated' :
                            'unchanged'
                          }:</strong>{' '}
                          {result.applied.subscription.action !== 'no_change' && (
                            <>
                              {result.applied.subscription.plan === 'annual' ? 'Premium Annual' : result.applied.subscription.plan}
                              {result.applied.subscription.expires_at && (
                                <> until {new Date(result.applied.subscription.expires_at).toLocaleDateString()}</>
                              )}
                            </>
                          )}
                          {result.applied.subscription.action === 'no_change' && 'No subscription change (Lifetime active)'}
                        </p>
                      )}
                      {result.applied.gifts && result.applied.gifts.length > 0 && (
                        <div>
                          <p className="text-sm text-slate-700 mb-2">
                            <strong>Gift available:</strong> {result.applied.gifts.length} Premium Annual gift{result.applied.gifts.length > 1 ? 's' : ''}
                          </p>
                          {result.applied.gifts.map((gift) => (
                            <Button
                              key={gift.id}
                              onClick={() => handleSendGift(gift.id)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Gift className="w-4 h-4" />
                              Send Gift
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-700">{result.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}