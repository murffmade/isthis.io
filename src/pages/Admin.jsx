import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, CreditCard, Settings, Search, Check, X, Crown, ToggleLeft, ToggleRight, BarChart3, FileText, TrendingUp, MessageSquare, Zap, BookOpen, ExternalLink, DollarSign, Activity, ChevronRight, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import AffiliatePerformance from '@/components/admin/AffiliatePerformance';
import UserActivityLogs from '@/components/admin/UserActivityLogs';
import SystemMetrics from '@/components/admin/SystemMetrics';
import AnalysisOverview from '@/components/admin/AnalysisOverview';
import RoleManagement from '@/components/admin/RoleManagement';
import TierManagement from '@/components/admin/TierManagement';
import UserRoleAssignment from '@/components/admin/UserRoleAssignment';
import PayoutManagement from '@/components/admin/PayoutManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import ContentModeration from '@/components/admin/ContentModeration';

function AdminStats() {
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: () => base44.entities.Subscription.list()
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['recentAnalyses'],
    queryFn: () => base44.entities.AnalysisRecord.list('-created_date', 1000)
  });

  const totalUsers = allUsers.length;
  const premiumUsers = subscriptions.filter(s => 
    (s.plan === 'annual' || s.plan === 'lifetime') && s.status === 'active'
  ).length;
  const freeUsers = totalUsers - premiumUsers;
  
  const today = new Date().toDateString();
  const activeToday = analyses.filter(a => 
    new Date(a.created_date).toDateString() === today
  ).length;

  return (
    <div className="lg:col-span-3 grid md:grid-cols-4 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <Users className="w-8 h-8 text-slate-900 mb-3" />
        <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
        <div className="text-sm text-slate-600">Total Users</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <CreditCard className="w-8 h-8 text-emerald-600 mb-3" />
        <div className="text-2xl font-bold text-slate-900">{premiumUsers}</div>
        <div className="text-sm text-slate-600">Premium Users</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <Shield className="w-8 h-8 text-blue-600 mb-3" />
        <div className="text-2xl font-bold text-slate-900">{freeUsers}</div>
        <div className="text-sm text-slate-600">Free Users</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <Settings className="w-8 h-8 text-purple-600 mb-3" />
        <div className="text-2xl font-bold text-slate-900">{activeToday}</div>
        <div className="text-sm text-slate-600">Analyses Today</div>
      </motion.div>
    </div>
  );
}

function FeatureToggles() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const allSettings = await base44.entities.AppSettings.list();
      return allSettings.length > 0 ? allSettings[0] : null;
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ field, value }) => {
      if (settings) {
        await base44.entities.AppSettings.update(settings.id, { [field]: value });
      } else {
        await base44.entities.AppSettings.create({ [field]: value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appSettings']);
      toast.success('Feature setting updated');
    }
  });

  const features = [
    { key: 'feature_is_this_real', label: 'Is This Real?', icon: Shield, color: 'text-slate-600' },
    { key: 'feature_is_this_true', label: 'Is This True?', icon: Check, color: 'text-blue-600' },
    { key: 'feature_is_this_scam', label: 'Is This a Scam?', icon: X, color: 'text-amber-600' },
    { key: 'feature_is_this_safe', label: 'Is This Safe?', icon: Shield, color: 'text-emerald-600' }
  ];

  const lifetimeOfferFields = [
    { key: 'lifetime_offer_enabled', label: 'Lifetime Offer Enabled', type: 'boolean' },
    { key: 'lifetime_show_countdown', label: 'Show Countdown Timer', type: 'boolean' },
    { key: 'lifetime_sold_count', label: 'Lifetime Sold Count', type: 'number' },
    { key: 'lifetime_max_count', label: 'Max Lifetime Licenses', type: 'number' },
    { key: 'lifetime_expiry_date', label: 'Offer Expiry Date', type: 'date' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-8"
    >
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Feature Toggles
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isEnabled = settings?.[feature.key] ?? true;
          
          return (
            <button
              key={feature.key}
              onClick={() => updateSettingMutation.mutate({ field: feature.key, value: !isEnabled })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isEnabled
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${feature.color}`} />
                  <span className="font-semibold text-slate-900">{feature.label}</span>
                </div>
                {isEnabled ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className={`text-sm ${isEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Lifetime Offer Management */}
      <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-indigo-600" />
          Lifetime Offer Management
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {lifetimeOfferFields.map((field) => {
            const value = settings?.[field.key];
            
            if (field.type === 'boolean') {
              return (
                <button
                  key={field.key}
                  onClick={() => updateSettingMutation.mutate({ field: field.key, value: !value })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    value
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{field.label}</span>
                    {value ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className={`text-sm ${value ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {value ? 'Enabled' : 'Disabled'}
                  </div>
                </button>
              );
            }
            
            if (field.type === 'number' || field.type === 'date') {
              return (
                <div key={field.key} className="p-4 rounded-xl border-2 border-slate-200 bg-white">
                  <label className="font-semibold text-slate-900 block mb-2">{field.label}</label>
                  <Input
                    type={field.type === 'date' ? 'date' : 'number'}
                    value={value || ''}
                    onChange={(e) => {
                      const newValue = field.type === 'number' ? parseInt(e.target.value) : e.target.value;
                      updateSettingMutation.mutate({ field: field.key, value: newValue });
                    }}
                    className="w-full"
                  />
                </div>
              );
            }
          })}
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
          <div className="text-sm text-slate-600 mb-2">Current Status:</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">
                {settings?.lifetime_sold_count || 0} / {settings?.lifetime_max_count || 500} sold
              </div>
              <div className="text-xs text-slate-500">
                {settings?.lifetime_max_count - (settings?.lifetime_sold_count || 0)} licenses remaining
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900">
                Expires: {new Date(settings?.lifetime_expiry_date || '2026-01-03').toLocaleDateString()}
              </div>
              <div className={`text-xs font-semibold ${settings?.lifetime_offer_enabled ? 'text-emerald-600' : 'text-red-600'}`}>
                {settings?.lifetime_offer_enabled ? 'Offer Active' : 'Offer Disabled'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Admin() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  // Search for user
  const { data: users = [] } = useQuery({
    queryKey: ['users', searchEmail],
    queryFn: async () => {
      if (!searchEmail) return [];
      return await base44.entities.User.filter({ email: searchEmail });
    },
    enabled: isAdmin && searchEmail.length > 0
  });

  // Get user's subscription
  const { data: userSubscription } = useQuery({
    queryKey: ['subscription', selectedUser?.email],
    queryFn: async () => {
      if (!selectedUser) return null;
      const subs = await base44.entities.Subscription.filter({ 
        created_by: selectedUser.email 
      });
      return subs.length > 0 ? subs[0] : null;
    },
    enabled: !!selectedUser
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ plan, status }) => {
      if (!selectedUser) return;
      
      if (userSubscription) {
        // Update existing
        await base44.entities.Subscription.update(userSubscription.id, {
          plan,
          status,
          expires_at: plan === 'lifetime' ? null : userSubscription.expires_at
        });
      } else {
        // Create new
        const subData = {
          plan,
          status,
          expires_at: plan === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        // Need to create as the user
        await base44.entities.Subscription.create(subData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
      toast.success('Subscription updated successfully');
    },
    onError: () => {
      toast.error('Failed to update subscription');
    }
  });

  const grantFreePremium = (plan) => {
    updateSubscriptionMutation.mutate({ plan, status: 'active' });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">You must be an admin to access this page.</p>
          <Button onClick={() => window.location.href = createPageUrl('Home')}>
            Go to Home
          </Button>
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Admin Panel</h1>
                <p className="text-xs text-slate-500">User & Subscription Management</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = createPageUrl('Home')}
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="mb-8 border-b border-slate-200">
          <div className="flex gap-1 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'moderation', label: 'Content Moderation', icon: Shield },
                { id: 'roles', label: 'Roles & Permissions', icon: Shield },
                { id: 'influencers', label: 'Influencers', icon: DollarSign },
                { id: 'payouts', label: 'Payouts', icon: DollarSign },
                { id: 'activity', label: 'User Activity', icon: Activity },
                { id: 'system', label: 'System Metrics', icon: TrendingUp },
                { id: 'analyses', label: 'Analyses', icon: Shield },
                { id: 'announcements', label: 'Announcements', icon: Megaphone },
                { id: 'users', label: 'User Management', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
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

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <AdminStats />
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Stats</h3>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Total Revenue</span>
                      <span className="text-lg font-bold text-slate-900">$0.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Active Sessions</span>
                      <span className="text-lg font-bold text-slate-900">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Support Tickets</span>
                      <span className="text-lg font-bold text-slate-900">-</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {[
                    { label: 'View All Analyses', tab: 'analyses', icon: Shield },
                    { label: 'Check Influencer Performance', tab: 'influencers', icon: DollarSign },
                    { label: 'Review User Activity', tab: 'activity', icon: Activity }
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.tab}
                        onClick={() => setActiveTab(action.tab)}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-indigo-600" />
                          <span className="font-medium text-slate-900">{action.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'moderation' && <ContentModeration />}
        {activeTab === 'roles' && (
          <div className="space-y-8">
            <RoleManagement />
            <UserRoleAssignment />
          </div>
        )}
        {activeTab === 'influencers' && (
          <div className="space-y-8">
            <TierManagement />
            <AffiliatePerformance />
          </div>
        )}
        {activeTab === 'payouts' && <PayoutManagement />}
        {activeTab === 'activity' && <UserActivityLogs />}
        {activeTab === 'system' && <SystemMetrics />}
        {activeTab === 'analyses' && <AnalysisOverview />}

        {activeTab === 'announcements' && (
          <div className="p-8">
            <p className="text-slate-600 mb-4">Send announcements from the dedicated page:</p>
            <Link to={createPageUrl('Announcements')}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Megaphone className="w-4 h-4 mr-2" />
                Go to Announcements
              </Button>
            </Link>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Access Dashboards */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-indigo-600" />
                Quick Access
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  to={createPageUrl('AnalysisDashboard')}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      <BarChart3 className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Analysis Dashboard</div>
                      <div className="text-xs text-slate-500">View all verifications</div>
                    </div>
                  </div>
                </Link>

                <Link
                  to={createPageUrl('TrainerDashboard')}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                      <Shield className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Trainer Dashboard</div>
                      <div className="text-xs text-slate-500">Model training</div>
                    </div>
                  </div>
                </Link>

                <Link
                  to={createPageUrl('FeedbackQueue')}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                      <MessageSquare className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Feedback Queue</div>
                      <div className="text-xs text-slate-500">Review feedback</div>
                    </div>
                  </div>
                </Link>

                <Link
                  to={createPageUrl('ModelPerformance')}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                      <TrendingUp className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Model Performance</div>
                      <div className="text-xs text-slate-500">AI metrics</div>
                    </div>
                  </div>
                </Link>

                <Link
                  to={createPageUrl('BlogDashboard')}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <FileText className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Blog Dashboard</div>
                      <div className="text-xs text-slate-500">Manage articles</div>
                    </div>
                  </div>
                </Link>

                <Link
                  to={createPageUrl('Support')}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-500 hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                      <MessageSquare className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Support Tickets</div>
                      <div className="text-xs text-slate-500">Customer support</div>
                    </div>
                  </div>
                </Link>

                <a
                  href={createPageUrl('AffiliateMarketing')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                      <DollarSign className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Affiliate Program</div>
                      <div className="text-xs text-slate-500">Manage affiliates</div>
                    </div>
                  </div>
                </a>

                <Link
                  to={createPageUrl('Admin')}
                  className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:border-purple-500 hover:bg-purple-100 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Admin Panel</div>
                      <div className="text-xs text-slate-500">You are here</div>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Feature Toggles */}
          <div className="lg:col-span-3">
            <FeatureToggles />
          </div>

          {/* Stats */}
          <AdminStats />

          {/* User Search */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-slate-200 p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">User Management</h2>
              
              <div className="mb-6">
                <Label htmlFor="search">Search User by Email</Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    id="search"
                    type="email"
                    placeholder="user@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button disabled={!searchEmail}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* User Results */}
              {users.length > 0 && (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedUser?.id === user.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-slate-600">{user.email}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Role: {user.role} • Created: {new Date(user.created_date).toLocaleDateString()}
                          </div>
                        </div>
                        {selectedUser?.id === user.id && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchEmail && users.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No users found with that email
                </div>
              )}
            </motion.div>
          </div>

          {/* Subscription Management */}
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Subscription Management for {selectedUser.email}
              </h2>

              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-2">Current Status:</div>
                {userSubscription ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-slate-900 capitalize">
                        {userSubscription.plan} Plan
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        userSubscription.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {userSubscription.status}
                      </span>
                    </div>
                    {userSubscription.expires_at && (
                      <div className="text-sm text-slate-600">
                        Expires: {new Date(userSubscription.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-900 font-semibold">Free Plan (No subscription)</div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Grant Free Premium Access:</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => grantFreePremium('annual')}
                    disabled={updateSubscriptionMutation.isPending}
                    variant="outline"
                    className="h-auto py-4 flex-col items-start border-blue-200 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <div className="font-semibold text-blue-900 mb-1">1 Year Premium</div>
                    <div className="text-xs text-slate-600">Grant annual plan access</div>
                  </Button>

                  <Button
                    onClick={() => grantFreePremium('lifetime')}
                    disabled={updateSubscriptionMutation.isPending}
                    className="h-auto py-4 flex-col items-start bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                  >
                    <div className="font-semibold mb-1">Lifetime Premium</div>
                    <div className="text-xs opacity-90">Grant lifetime access</div>
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Additional Actions:</h3>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        updateSubscriptionMutation.mutate({ 
                          plan: userSubscription?.plan || 'free', 
                          status: 'cancelled' 
                        });
                      }}
                      disabled={updateSubscriptionMutation.isPending}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-400"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Revoke Premium
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          </div>
        )}
      </main>
    </div>
  );
}