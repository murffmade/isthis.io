import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Link as LinkIcon, Copy, Users, TrendingUp, CheckCircle2, ExternalLink, BarChart3, Calendar, Mail, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PromoRedemptionStats from '@/components/admin/PromoRedemptionStats';

export default function AffiliateDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: affiliate } = useQuery({
    queryKey: ['myAffiliate', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const affiliates = await base44.entities.AffiliatePartner.filter({ 
        created_by: user.email 
      });
      return affiliates.length > 0 ? affiliates[0] : null;
    },
    enabled: !!user
  });

  const { data: clicks = [] } = useQuery({
    queryKey: ['affiliateClicks', affiliate?.affiliate_code],
    queryFn: async () => {
      if (!affiliate) return [];
      return await base44.entities.AffiliateClick.filter({ 
        affiliate_code: affiliate.affiliate_code 
      });
    },
    enabled: !!affiliate
  });

  const createAffiliateMutation = useMutation({
    mutationFn: async () => {
      const code = `${user.email.split('@')[0]}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
      return await base44.entities.AffiliatePartner.create({
        affiliate_code: code,
        company_name: companyName || user.full_name || 'Affiliate',
        website: website || '',
        payment_email: paymentEmail || user.email,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myAffiliate']);
      toast.success('Affiliate account created!');
    }
  });

  const affiliateUrl = affiliate ? `${window.location.origin}?ref=${affiliate.affiliate_code}` : '';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const conversions = clicks.filter(c => c.converted);
  const totalEarnings = conversions.reduce((sum, c) => sum + (c.conversion_value * 0.3), 0);

  // Chart data - last 7 days
  const chartData = React.useMemo(() => {
    const days = 7;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayClicks = clicks.filter(c => 
        new Date(c.created_date).toISOString().split('T')[0] === dateStr
      );
      const dayConversions = dayClicks.filter(c => c.converted);
      const dayEarnings = dayConversions.reduce((sum, c) => sum + (c.conversion_value * 0.3), 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: dayClicks.length,
        conversions: dayConversions.length,
        earnings: parseFloat(dayEarnings.toFixed(2))
      });
    }
    
    return data;
  }, [clicks]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please sign in to access the affiliate dashboard</h2>
          <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Become an Affiliate</h1>
              <p className="text-slate-600">Start earning 30% commission on every sale you refer</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Company/Name</label>
                <Input
                  placeholder="Your name or company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Website (optional)</label>
                <Input
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Payment Email</label>
                <Input
                  type="email"
                  placeholder={user.email}
                  value={paymentEmail}
                  onChange={(e) => setPaymentEmail(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">Where should we send your payouts?</p>
              </div>
            </div>

            <Button
              onClick={() => createAffiliateMutation.mutate()}
              disabled={createAffiliateMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Create My Affiliate Account
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Affiliate Dashboard</h1>
              <p className="text-sm text-slate-600">Track your earnings and performance</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                affiliate.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {affiliate.status}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="mb-8 border-b border-slate-200">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'promos', label: 'Promo Codes', icon: TicketPercent }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'promos' && (
          <PromoRedemptionStats affiliateId={affiliate.id} />
        )}

        {activeTab === 'overview' && (
          <>
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div className="text-sm text-slate-600">Total Earnings</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">${totalEarnings.toFixed(2)}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="text-sm text-slate-600">Total Clicks</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{clicks.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <div className="text-sm text-slate-600">Conversions</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{conversions.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div className="text-sm text-slate-600">Conversion Rate</div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {clicks.length > 0 ? ((conversions.length / clicks.length) * 100).toFixed(1) : 0}%
            </div>
          </motion.div>
        </div>

        {/* Affiliate Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Your Affiliate Link</h2>
          </div>
          
          <div className="flex gap-3">
            <Input
              readOnly
              value={affiliateUrl}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={() => copyToClipboard(affiliateUrl)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(affiliateUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-sm text-indigo-900">
              <strong>Your code:</strong> <code className="bg-white px-2 py-1 rounded font-mono text-xs">{affiliate.affiliate_code}</code>
            </p>
            <p className="text-xs text-indigo-700 mt-2">
              Share this link anywhere to earn 30% commission on all sales
            </p>
          </div>
        </motion.div>

        {/* Performance Charts */}
        {clicks.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Clicks & Conversions Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Clicks & Conversions (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" />
                  <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Earnings Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Earnings Trend (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => `$${value}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    name="Earnings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Email Notification Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-2">Email Notifications Enabled</h3>
              <p className="text-sm text-slate-600 mb-3">
                We'll send you an email notification whenever:
              </p>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  Someone clicks your affiliate link
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  A referral converts to a paid customer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  Your payout is processed
                </li>
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                Notifications are sent to <strong>{affiliate.payment_email}</strong>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl border border-slate-200 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          </div>

          {clicks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No clicks yet. Start sharing your link!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clicks.slice(0, 10).map((click, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {click.converted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Users className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">
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
          </>
        )}
      </main>
    </div>
  );
}