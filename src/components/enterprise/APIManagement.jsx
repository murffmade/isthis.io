import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff,
  AlertTriangle,
  ExternalLink,
  Activity,
  Calendar,
  Code,
  FileCode
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function APIManagement() {
  const queryClient = useQueryClient();
  const [keyName, setKeyName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => base44.entities.APIKey.list()
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name) => {
      const result = await base44.functions.invoke('generateApiKey', { key_name: name });
      return result.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setNewApiKey(data.api_key);
        setShowForm(false);
        setKeyName('');
        queryClient.invalidateQueries(['apiKeys']);
        toast.success('API key created successfully');
      } else {
        toast.error(data.error || 'Failed to create API key');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create API key');
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      const result = await base44.functions.invoke('revokeApiKey', { key_id: keyId });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['apiKeys']);
      toast.success('API key revoked');
    },
    onError: () => {
      toast.error('Failed to revoke API key');
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    const prefix = key.substring(0, 13); // "isthis_" + first 6 chars
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'•'.repeat(40)}${suffix}`;
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">API Management</h2>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage API keys for external integrations
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={apiKeys.length >= 10}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* New API Key Display */}
      <AnimatePresence>
        {newApiKey && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-emerald-900 mb-1">API Key Created Successfully!</h3>
                <p className="text-sm text-emerald-700">
                  Save this key securely. It will not be shown again. Anyone with this key can make requests on your behalf.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-mono text-slate-900 break-all flex-1">
                  {newApiKey}
                </code>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(newApiKey)}
                  className="flex-shrink-0"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setNewApiKey(null)}
              variant="outline"
              className="mt-4 w-full border-emerald-300"
            >
              I've saved my key securely
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Key Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl border-2 border-slate-200 p-6"
          >
            <h3 className="font-bold text-slate-900 mb-4">Create New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Key Name
                </label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production API, Development, Mobile App"
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Choose a descriptive name to identify where this key will be used
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => createKeyMutation.mutate(keyName)}
                  disabled={!keyName || createKeyMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setKeyName('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Active API Keys</h3>
          <p className="text-sm text-slate-600 mt-1">
            {apiKeys.length} of 10 keys created
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">No API keys yet</p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Key
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Key className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{key.key_name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Activity className="w-3 h-3" />
                            {key.usage_count || 0} requests
                          </div>
                          {key.last_used && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              Last used {new Date(key.last_used).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-slate-700 flex-1 overflow-hidden">
                          {visibleKeys[key.id] ? key.api_key : maskApiKey(key.api_key)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="flex-shrink-0"
                        >
                          {visibleKeys[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(key.api_key)}
                          className="flex-shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Are you sure? This will permanently revoke this API key.')) {
                        revokeKeyMutation.mutate(key.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileCode className="w-6 h-6 text-slate-700" />
          <h3 className="font-bold text-slate-900">API Documentation</h3>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Endpoint</h4>
            <code className="block text-sm bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono">
              POST https://your-app.base44.run/api/analyzeContent
            </code>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Authentication</h4>
            <code className="block text-sm bg-slate-900 text-slate-300 p-3 rounded-lg font-mono">
              x-api-key: your_api_key_here
            </code>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Request Body</h4>
            <pre className="text-xs bg-slate-900 text-slate-300 p-4 rounded-lg font-mono overflow-x-auto">
{`{
  "content_type": "text|image|video",
  "content": "text content...",
  "file_url": "https://...",
  "analysis_types": ["moderation", "bias", "sentiment", "summary"]
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Response</h4>
            <pre className="text-xs bg-slate-900 text-slate-300 p-4 rounded-lg font-mono overflow-x-auto">
{`{
  "success": true,
  "analysis_id": "uuid",
  "timestamp": "ISO 8601",
  "overall_risk_score": 0-100,
  "violations": ["array of violations"],
  "results": {
    "moderation": { ... },
    "bias": { ... },
    "sentiment": { ... },
    "summary": { ... }
  }
}`}
            </pre>
          </div>

          <div className="pt-4 border-t border-slate-300">
            <p className="text-sm text-slate-600 mb-3">
              <strong>Rate Limits:</strong> No rate limits for Premium users
            </p>
            <p className="text-sm text-slate-600">
              <strong>Security:</strong> Keep your API keys secure. Never expose them in client-side code or public repositories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}