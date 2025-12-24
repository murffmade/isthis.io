import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, CreditCard, Key, Trash2, Save, Check, Eye, EyeOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: (await base44.auth.me()).email });
      return subs[0] || null;
    }
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      return base44.entities.APIKey.filter({ created_by: (await base44.auth.me()).email });
    }
  });

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Home')} className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account and preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 sticky top-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'account' && <AccountTab user={user} />}
              {activeTab === 'preferences' && <PreferencesTab />}
              {activeTab === 'privacy' && <PrivacyTab />}
              {activeTab === 'subscription' && <SubscriptionTab subscription={subscription} />}
              {activeTab === 'api' && <APIKeysTab apiKeys={apiKeys} />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile updated!');
      setEditing(false);
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Account Information</h2>
        <p className="text-sm text-slate-600">Update your personal details</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editing}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input value={user?.email} disabled className="mt-1 bg-slate-50" />
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <Label>Role</Label>
          <div className="mt-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-900 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        {editing ? (
          <>
            <Button onClick={() => updateMutation.mutate({ full_name: name })} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button onClick={() => setEditing(false)} variant="outline">
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)} variant="outline">
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
}

function PreferencesTab() {
  const { data: prefs } = useQuery({
    queryKey: ['userPrefs'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const preferences = await base44.entities.UserPreferences.filter({ created_by: me.email });
      return preferences[0] || {};
    }
  });

  const queryClient = useQueryClient();

  const updatePrefsMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      const existing = await base44.entities.UserPreferences.filter({ created_by: me.email });
      if (existing[0]) {
        return base44.entities.UserPreferences.update(existing[0].id, data);
      } else {
        return base44.entities.UserPreferences.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPrefs'] });
      toast.success('Preferences saved!');
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Preferences</h2>
        <p className="text-sm text-slate-600">Customize your experience</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Default Verification Mode</Label>
          <select
            value={prefs?.last_mode || 'real'}
            onChange={(e) => updatePrefsMutation.mutate({ last_mode: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
          >
            <option value="real">Is This Real?</option>
            <option value="true">Is This True?</option>
            <option value="scam">Is This a Scam?</option>
            <option value="safe">Is This Safe?</option>
          </select>
        </div>

        <div>
          <Label>Risk Tolerance</Label>
          <select
            value={prefs?.risk_tolerance || 'medium'}
            onChange={(e) => updatePrefsMutation.mutate({ risk_tolerance: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
          >
            <option value="low">Low - Extra cautious</option>
            <option value="medium">Medium - Balanced</option>
            <option value="high">High - Accept more risk</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="font-medium text-slate-900">Save Analysis History</div>
            <div className="text-sm text-slate-600">Keep records of your verifications</div>
          </div>
          <button
            onClick={() => updatePrefsMutation.mutate({ save_history: !prefs?.save_history })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              prefs?.save_history ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                prefs?.save_history ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Privacy & Security</h2>
        <p className="text-sm text-slate-600">Manage your data and security settings</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-900 mb-1">Your data is secure</div>
              <div className="text-sm text-emerald-700">
                We use industry-standard encryption and never share your personal information with third parties.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Data Management</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Eye className="w-4 h-4" />
              Download My Data
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab({ subscription }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Subscription</h2>
        <p className="text-sm text-slate-600">Manage your plan and billing</p>
      </div>

      {subscription ? (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-900 capitalize">{subscription.plan}</div>
                <div className="text-sm text-indigo-600">
                  {subscription.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            {subscription.expires_at && (
              <div className="text-sm text-slate-600">
                Expires: {new Date(subscription.expires_at).toLocaleDateString()}
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full">
            Manage Billing
          </Button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-slate-500 mb-4">You're on the Free plan</div>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Upgrade Now
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function APIKeysTab({ apiKeys }) {
  const [showKey, setShowKey] = useState({});
  const queryClient = useQueryClient();

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const keyName = prompt('Enter a name for this API key:');
      if (!keyName) return;
      const randomKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      return base44.entities.APIKey.create({ key_name: keyName, api_key: randomKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key created!');
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">API Keys</h2>
          <p className="text-sm text-slate-600">Manage your API access keys</p>
        </div>
        <Button onClick={() => createKeyMutation.mutate()} className="gap-2">
          <Key className="w-4 h-4" />
          Create Key
        </Button>
      </div>

      <div className="space-y-3">
        {apiKeys.map((key) => (
          <div key={key.id} className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-900">{key.key_name}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
              >
                {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-slate-50 px-3 py-2 rounded border border-slate-200 font-mono">
                {showKey[key.id] ? key.api_key : '••••••••••••••••'}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(key.api_key);
                  toast.success('Copied to clipboard!');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Created {new Date(key.created_date).toLocaleDateString()} • Used {key.usage_count} times
            </div>
          </div>
        ))}
        {apiKeys.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No API keys yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}