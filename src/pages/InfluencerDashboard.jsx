import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Link as LinkIcon, Copy, Users, TrendingUp, CheckCircle2, ExternalLink, BarChart3, Edit2, Plus, Trash2, Calendar, Activity, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InfluencerDashboard() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');
  const [linkName, setLinkName] = useState('');
  const [editingLink, setEditingLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: influencer } = useQuery({
    queryKey: ['myInfluencer', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const influencers = await base44.entities.InfluencerPartner.filter({ 
        created_by: user.email 
      });
      return influencers.length > 0 ? influencers[0] : null;
    },
    enabled: !!user
  });

  const { data: clicks = [] } = useQuery({
    queryKey: ['influencerClicks', influencer?.influencer_code],
    queryFn: async () => {
      if (!influencer) return [];
      return await base44.entities.InfluencerClick.filter({ 
        influencer_code: influencer.influencer_code 
      });
    },
    enabled: !!influencer
  });

  const createInfluencerMutation = useMutation({
    mutationFn: async () => {
      const code = `${user.email.split('@')[0]}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
      return await base44.entities.InfluencerPartner.create({
        influencer_code: code,
        link_name: linkName || 'My Link',
        company_name: companyName || user.full_name || 'Influencer',
        website: website || '',
        payment_email: paymentEmail || user.email,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myInfluencer']);
      toast.success('Influencer account created!');
    }
  });

  const updateLinkNameMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.InfluencerPartner.update(influencer.id, {
        link_name: newLinkName
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myInfluencer']);
      toast.success('Link name updated!');
      setEditingLink(false);
    }
  });

  const influencerUrl = influencer ? `${window.location.origin}?ref=${influencer.influencer_code}` : '';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const conversions = clicks.filter(c => c.converted);
  const totalEarnings = conversions.reduce((sum, c) => sum + (c.conversion_value * 0.3), 0);
  
  // Analytics
  const last7Days = clicks.filter(c => new Date() - new Date(c.created_date) < 7 * 24 * 60 * 60 * 1000);
  const last30Days = clicks.filter(c => new Date() - new Date(c.created_date) < 30 * 24 * 60 * 60 * 1000);

  if (!user) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-6">
        <div className="glass-effect rounded-3xl p-8 text-center shadow-medium max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please sign in to access the influencer dashboard</h2>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-indigo-600 to-purple-600">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen gradient-mesh">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-3xl p-8 sm:p-12 shadow-medium"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Become an Influencer</h1>
              <p className="text-lg text-slate-600">Start earning 30% commission on every sale you refer</p>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Link Name</label>
                <Input
                  placeholder="e.g., My Special Link, YouTube Promo"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-slate-500 mt-1">Give your link a memorable name</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Company/Name</label>
                <Input
                  placeholder="Your name or company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Website (optional)</label>
                <Input
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-12"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Payment Email</label>
                <Input
                  type="email"
                  placeholder={user.email}
                  value={paymentEmail}
                  onChange={(e) => setPaymentEmail(e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-slate-500 mt-1">Where should we send your payouts?</p>
              </div>
            </div>

            <Button
              onClick={() => createInfluencerMutation.mutate()}
              disabled={createInfluencerMutation.isPending}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg font-bold shadow-lg button-shine"
            >
              Create My Influencer Account
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')}>
                <Button variant="outline" size="sm">← Home</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Influencer Dashboard</h1>
                <p className="text-sm text-slate-600 font-medium">Track your earnings and performance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-soft ${
                influencer.status === 'active' 
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {influencer.status}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-600">Total Earnings</div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">${totalEarnings.toFixed(2)}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">+${(conversions.slice(-1)[0]?.conversion_value * 0.3 || 0).toFixed(2)} recent</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-600">Total Clicks</div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{clicks.length}</div>
            <div className="text-xs text-blue-600 font-medium mt-1">{last7Days.length} last 7 days</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-600">Conversions</div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{conversions.length}</div>
            <div className="text-xs text-purple-600 font-medium mt-1">{conversions.filter(c => last30Days.includes(c)).length} this month</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-600">Conversion Rate</div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {clicks.length > 0 ? ((conversions.length / clicks.length) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-pink-600 font-medium mt-1">Industry avg: 2-5%</div>
          </motion.div>
        </div>

        {/* Influencer Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-2xl p-8 mb-8 shadow-soft"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <LinkIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Influencer Link</h2>
                <p className="text-sm text-slate-600 font-medium">{influencer.link_name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewLinkName(influencer.link_name);
                setEditingLink(true);
              }}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </Button>
          </div>
          
          <AnimatePresence>
            {editingLink && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200"
              >
                <label className="text-sm font-semibold text-indigo-900 mb-2 block">New Link Name</label>
                <div className="flex gap-3">
                  <Input
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="My Special Link"
                    className="flex-1"
                  />
                  <Button onClick={() => updateLinkNameMutation.mutate()}>
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingLink(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mb-4">
            <Input
              readOnly
              value={influencerUrl}
              className="flex-1 font-mono text-sm bg-slate-50"
            />
            <Button onClick={() => copyToClipboard(influencerUrl)} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600">
              <Copy className="w-4 h-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(influencerUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-indigo-900 font-semibold">
                  Your code: <code className="bg-white px-2 py-1 rounded font-mono text-xs">{influencer.influencer_code}</code>
                </p>
                <p className="text-sm text-indigo-700 mt-2">
                  Share this link anywhere to earn 30% commission on all sales. Every click and conversion is tracked automatically.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-effect rounded-2xl p-8 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Performance Overview</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-slate-600">Last 7 Days</div>
                  <div className="text-2xl font-bold text-slate-900">{last7Days.length} clicks</div>
                </div>
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-slate-600">Last 30 Days</div>
                  <div className="text-2xl font-bold text-slate-900">{last30Days.length} clicks</div>
                </div>
                <BarChart3 className="w-8 h-8 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <div>
                  <div className="text-sm font-semibold text-emerald-700">Pending Payout</div>
                  <div className="text-2xl font-bold text-emerald-900">${influencer.pending_payout || totalEarnings.toFixed(2)}</div>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-2xl p-8 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-slate-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
            </div>

            {clicks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No clicks yet</p>
                <p className="text-sm">Start sharing your link!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clicks.slice().reverse().slice(0, 10).map((click, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      {click.converted ? (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {click.converted ? 'Conversion' : 'Click'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(click.created_date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {click.converted && (
                      <div className="text-sm font-bold text-emerald-600">
                        +${(click.conversion_value * 0.3).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}