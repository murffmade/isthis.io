import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Eye, Ban, TicketPercent } from 'lucide-react';
import { toast } from 'sonner';

export default function PromoCodesAdmin() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [viewingRedemptions, setViewingRedemptions] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const isAdmin = currentUser?.role === 'admin';

  // Fetch promo codes
  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['promoCodes'],
    queryFn: () => base44.entities.PromoCode.list('-created_date'),
    enabled: isAdmin
  });

  // Fetch affiliate partners for dropdown
  const { data: affiliatePartners = [] } = useQuery({
    queryKey: ['affiliatePartners'],
    queryFn: () => base44.entities.AffiliatePartner.list(),
    enabled: isAdmin
  });

  // Seed promo code "241"
  useEffect(() => {
    if (!isAdmin || promoCodes.length === 0) return;

    const seed241 = async () => {
      const existing = promoCodes.find(p => p.code === '241');
      if (!existing) {
        try {
          await base44.entities.PromoCode.create({
            code: '241',
            status: 'active',
            max_redemptions_per_account: 1,
            max_redemptions_total: null,
            affiliate_partner_id: null,
            benefit_payload: {
              subscription_grant: { plan: 'annual', months: 12 },
              gift_entitlement: { plan: 'annual', quantity: 1 }
            }
          });
          queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
        } catch (error) {
          console.error('Failed to seed 241:', error);
        }
      }
    };

    seed241();
  }, [isAdmin, promoCodes, queryClient]);

  // Create/update mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingPromo) {
        return base44.entities.PromoCode.update(editingPromo.id, data);
      } else {
        return base44.entities.PromoCode.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
      setShowCreateDialog(false);
      setEditingPromo(null);
      toast.success('Promo code saved');
    },
    onError: () => {
      toast.error('Failed to save promo code');
    }
  });

  // Disable mutation
  const disableMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.update(id, { status: 'disabled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
      toast.success('Promo code disabled');
    }
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Promo Codes</h2>
          <p className="text-sm text-slate-600">Manage promotional codes and redemptions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingPromo(null)}>
              <Plus className="w-4 h-4" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <PromoCodeForm
              promo={editingPromo}
              affiliatePartners={affiliatePartners}
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => {
                setShowCreateDialog(false);
                setEditingPromo(null);
              }}
              saving={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {promoCodes.map((promo) => (
            <PromoCodeCard
              key={promo.id}
              promo={promo}
              affiliatePartners={affiliatePartners}
              onEdit={() => {
                setEditingPromo(promo);
                setShowCreateDialog(true);
              }}
              onDisable={() => disableMutation.mutate(promo.id)}
              onViewRedemptions={() => setViewingRedemptions(promo.id)}
            />
          ))}

          {promoCodes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <TicketPercent className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No promo codes yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {viewingRedemptions && (
        <RedemptionsDialog
          promoCodeId={viewingRedemptions}
          onClose={() => setViewingRedemptions(null)}
        />
      )}
    </div>
  );
}

function PromoCodeCard({ promo, affiliatePartners, onEdit, onDisable, onViewRedemptions }) {
  const { data: redemptions = [] } = useQuery({
    queryKey: ['promoRedemptions', promo.id],
    queryFn: () => base44.entities.PromoRedemption.filter({ promo_code_id: promo.id })
  });

  const affiliatePartner = affiliatePartners.find(a => a.id === promo.affiliate_partner_id);
  const now = new Date();
  const isExpired = promo.end_date && new Date(promo.end_date) < now;
  const notStarted = promo.start_date && new Date(promo.start_date) > now;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <code className="text-lg font-mono">{promo.code}</code>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                promo.status === 'active' && !isExpired && !notStarted
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {promo.status === 'disabled' ? 'Disabled' :
                 isExpired ? 'Expired' :
                 notStarted ? 'Scheduled' :
                 'Active'}
              </span>
            </CardTitle>
            <CardDescription>
              {redemptions.length} / {promo.max_redemptions_total || '∞'} total redemptions
              {' • '}
              Max {promo.max_redemptions_per_account} per account
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onViewRedemptions}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            {promo.status === 'active' && (
              <Button variant="ghost" size="sm" onClick={onDisable}>
                <Ban className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {affiliatePartner && (
            <div>
              <span className="text-slate-500">Affiliate:</span>{' '}
              <span className="font-medium">{affiliatePartner.company_name}</span>
            </div>
          )}
          {promo.start_date && (
            <div>
              <span className="text-slate-500">Starts:</span>{' '}
              <span className="font-medium">{new Date(promo.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {promo.end_date && (
            <div>
              <span className="text-slate-500">Ends:</span>{' '}
              <span className="font-medium">{new Date(promo.end_date).toLocaleDateString()}</span>
            </div>
          )}
          {promo.benefit_payload && (
            <div className="col-span-2">
              <span className="text-slate-500">Benefits:</span>{' '}
              {promo.benefit_payload.subscription_grant && (
                <span className="font-medium">
                  {promo.benefit_payload.subscription_grant.months}mo {promo.benefit_payload.subscription_grant.plan}
                </span>
              )}
              {promo.benefit_payload.gift_entitlement && (
                <span className="font-medium">
                  {' + '}{promo.benefit_payload.gift_entitlement.quantity}x gift
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PromoCodeForm({ promo, affiliatePartners, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    code: promo?.code || '',
    status: promo?.status || 'active',
    start_date: promo?.start_date || '',
    end_date: promo?.end_date || '',
    max_redemptions_total: promo?.max_redemptions_total || '',
    max_redemptions_per_account: promo?.max_redemptions_per_account || 1,
    affiliate_partner_id: promo?.affiliate_partner_id || '',
    subscription_enabled: !!promo?.benefit_payload?.subscription_grant,
    subscription_plan: promo?.benefit_payload?.subscription_grant?.plan || 'annual',
    subscription_months: promo?.benefit_payload?.subscription_grant?.months || 12,
    gift_enabled: !!promo?.benefit_payload?.gift_entitlement,
    gift_plan: promo?.benefit_payload?.gift_entitlement?.plan || 'annual',
    gift_quantity: promo?.benefit_payload?.gift_entitlement?.quantity || 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const benefit_payload = {};
    if (formData.subscription_enabled) {
      benefit_payload.subscription_grant = {
        plan: formData.subscription_plan,
        months: parseInt(formData.subscription_months)
      };
    }
    if (formData.gift_enabled) {
      benefit_payload.gift_entitlement = {
        plan: formData.gift_plan,
        quantity: parseInt(formData.gift_quantity)
      };
    }

    onSave({
      code: formData.code.trim().toUpperCase(),
      status: formData.status,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      max_redemptions_total: formData.max_redemptions_total ? parseInt(formData.max_redemptions_total) : null,
      max_redemptions_per_account: parseInt(formData.max_redemptions_per_account),
      affiliate_partner_id: formData.affiliate_partner_id || null,
      benefit_payload
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{promo ? 'Edit' : 'Create'} Promo Code</DialogTitle>
        <DialogDescription>
          Configure promotional code settings and benefits
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Code *</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="PROMO2024"
            required
            disabled={!!promo}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Affiliate Partner</Label>
            <Select value={formData.affiliate_partner_id} onValueChange={(v) => setFormData({ ...formData, affiliate_partner_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {affiliatePartners.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Max Total Redemptions</Label>
            <Input
              type="number"
              value={formData.max_redemptions_total}
              onChange={(e) => setFormData({ ...formData, max_redemptions_total: e.target.value })}
              placeholder="Unlimited"
            />
          </div>

          <div>
            <Label>Max Per Account *</Label>
            <Input
              type="number"
              value={formData.max_redemptions_per_account}
              onChange={(e) => setFormData({ ...formData, max_redemptions_per_account: e.target.value })}
              min="1"
              required
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Benefits</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Grant Subscription</Label>
              <Switch
                checked={formData.subscription_enabled}
                onCheckedChange={(v) => setFormData({ ...formData, subscription_enabled: v })}
              />
            </div>

            {formData.subscription_enabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <Label>Plan</Label>
                  <Select value={formData.subscription_plan} onValueChange={(v) => setFormData({ ...formData, subscription_plan: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Months</Label>
                  <Input
                    type="number"
                    value={formData.subscription_months}
                    onChange={(e) => setFormData({ ...formData, subscription_months: e.target.value })}
                    min="1"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Issue Gift Code</Label>
              <Switch
                checked={formData.gift_enabled}
                onCheckedChange={(v) => setFormData({ ...formData, gift_enabled: v })}
              />
            </div>

            {formData.gift_enabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <Label>Plan</Label>
                  <Select value={formData.gift_plan} onValueChange={(v) => setFormData({ ...formData, gift_plan: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formData.gift_quantity}
                    onChange={(e) => setFormData({ ...formData, gift_quantity: e.target.value })}
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

function RedemptionsDialog({ promoCodeId, onClose }) {
  const { data: redemptions = [], isLoading } = useQuery({
    queryKey: ['promoRedemptions', promoCodeId],
    queryFn: () => base44.entities.PromoRedemption.filter({ promo_code_id: promoCodeId })
  });

  return (
    <Dialog open={!!promoCodeId} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Redemption History</DialogTitle>
          <DialogDescription>
            {redemptions.length} total redemptions
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : redemptions.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No redemptions yet</p>
          ) : (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="font-medium">{r.redeemed_by_email}</div>
                  <div className="text-slate-500 text-xs">
                    {new Date(r.created_date).toLocaleString()}
                    {r.gift_code_ids?.length > 0 && (
                      <span className="ml-2">• {r.gift_code_ids.length} gift(s) issued</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}