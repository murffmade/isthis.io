import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Key, Copy, Eye, EyeOff, Code, Terminal, CheckCircle2, AlertCircle, Lock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function APIInternal() {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => base44.entities.APIKey.list('-created_date'),
    enabled: !!currentUser
  });

  const generateMutation = useMutation({
    mutationFn: async (name) => {
      const result = await base44.functions.invoke('generateApiKey', { name });
      return result.data;
    },
    onSuccess: (data) => {
      setGeneratedKey(data.api_key);
      setNewKeyName('');
      queryClient.invalidateQueries(['apiKeys']);
      toast.success('API key generated');
    },
    onError: () => toast.error('Failed to generate API key')
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId) => {
      await base44.functions.invoke('revokeApiKey', { key_id: keyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['apiKeys']);
      toast.success('API key revoked');
    },
    onError: () => toast.error('Failed to revoke API key')
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '••••••••••••••••';
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <Lock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to access API documentation.</p>
          <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Internal API</h1>
                <p className="text-xs text-slate-500">Assessment API Documentation</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Overview */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4" />
            Internal Use Only
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">API Documentation</h2>
          <p className="text-lg text-slate-600 max-w-3xl">
            Programmatic access to IsThis.io's AI-origin risk assessment engine. 
            This API is currently for internal use only and requires authentication.
          </p>
        </div>

        {/* API Key Management */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-indigo-600" />
            <h3 className="text-2xl font-bold text-slate-900">API Key Management</h3>
          </div>

          {generatedKey && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900 mb-2">API Key Generated</p>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="flex-1 px-3 py-2 bg-white rounded border border-emerald-300 font-mono text-sm">
                      {generatedKey}
                    </code>
                    <Button size="sm" onClick={() => copyToClipboard(generatedKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-emerald-700">Save this key now. You won't be able to see it again.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Generate New API Key</label>
            <div className="flex gap-2">
              <Input
                placeholder="Key name (e.g., Production API)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => generateMutation.mutate(newKeyName)}
                disabled={!newKeyName || generateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Generate
              </Button>
            </div>
          </div>

          {apiKeys.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Active Keys</h4>
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{key.key_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-slate-600">
                          {visibleKeys[key.id] ? key.api_key : maskKey(key.api_key)}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {visibleKeys[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Used {key.usage_count || 0} times
                        {key.last_used && ` • Last: ${new Date(key.last_used).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeMutation.mutate(key.id)}
                      disabled={revokeMutation.isPending}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="w-6 h-6 text-indigo-600" />
              <h3 className="text-2xl font-bold text-slate-900">API Endpoints</h3>
            </div>

            {/* POST /api/assess */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-600 text-white text-sm font-bold rounded">POST</span>
                  <code className="text-lg font-mono text-slate-900">/api/assess</code>
                </div>
                <p className="text-sm text-slate-600 mt-2">Run an AI-origin risk assessment on text content</p>
              </div>
              <div className="p-6">
                <h5 className="font-semibold text-slate-900 mb-2">Request Headers</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm mb-4 overflow-auto">
{`X-API-Key: your_api_key_here
Content-Type: application/json`}
                </pre>

                <h5 className="font-semibold text-slate-900 mb-2">Request Body</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm mb-4 overflow-auto">
{`{
  "text": "Content to analyze...",
  "context": {
    "source_type": "article",
    "language": "en",
    "industry": "technology"
  },
  "store_raw_text": false,
  "comparative_mode": false
}`}
                </pre>

                <h5 className="font-semibold text-slate-900 mb-2">Response</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm overflow-auto">
{`{
  "success": true,
  "assessment_id": "uuid",
  "result": {
    "risk_level": "MEDIUM",
    "likelihood_min": 45,
    "likelihood_max": 65,
    "meta_confidence": "MEDIUM",
    "signals": [...],
    "narrative_explanation": "..."
  }
}`}
                </pre>
              </div>
            </div>

            {/* GET /api/results/:id */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded">GET</span>
                  <code className="text-lg font-mono text-slate-900">/api/results/:id</code>
                </div>
                <p className="text-sm text-slate-600 mt-2">Retrieve a specific assessment result</p>
              </div>
              <div className="p-6">
                <h5 className="font-semibold text-slate-900 mb-2">Request Headers</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm mb-4 overflow-auto">
{`X-API-Key: your_api_key_here`}
                </pre>

                <h5 className="font-semibold text-slate-900 mb-2">Response</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm overflow-auto">
{`{
  "success": true,
  "result": {
    "id": "uuid",
    "risk_level": "MEDIUM",
    "likelihood_min": 45,
    "likelihood_max": 65,
    "signals": [...],
    "created_date": "2025-01-01T00:00:00Z"
  },
  "assessment": {
    "id": "uuid",
    "context": {...}
  }
}`}
                </pre>
              </div>
            </div>

            {/* POST /api/batch */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded">POST</span>
                  <code className="text-lg font-mono text-slate-900">/api/batch</code>
                </div>
                <p className="text-sm text-slate-600 mt-2">Create a batch assessment job</p>
              </div>
              <div className="p-6">
                <h5 className="font-semibold text-slate-900 mb-2">Request Body</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm mb-4 overflow-auto">
{`{
  "name": "Batch Assessment 1",
  "items": [
    {"text": "First text to analyze..."},
    {"text": "Second text to analyze..."}
  ],
  "context": {
    "source_type": "article",
    "language": "en"
  }
}`}
                </pre>

                <h5 className="font-semibold text-slate-900 mb-2">Response</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm overflow-auto">
{`{
  "success": true,
  "batch_id": "uuid",
  "total_items": 2,
  "completed_items": 2,
  "status": "completed"
}`}
                </pre>
              </div>
            </div>

            {/* GET /api/batch/:id */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-600 text-white text-sm font-bold rounded">GET</span>
                  <code className="text-lg font-mono text-slate-900">/api/batch/:id</code>
                </div>
                <p className="text-sm text-slate-600 mt-2">Get batch job status and results</p>
              </div>
              <div className="p-6">
                <h5 className="font-semibold text-slate-900 mb-2">Response</h5>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm overflow-auto">
{`{
  "success": true,
  "batch": {
    "id": "uuid",
    "name": "Batch Assessment 1",
    "status": "completed",
    "total_items": 2,
    "completed_items": 2
  },
  "items": [...],
  "results": [...]
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Error Codes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mt-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-2xl font-bold text-slate-900">Error Codes</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <code className="px-2 py-1 bg-slate-200 rounded font-mono">401</code>
              <span className="text-slate-700">Unauthorized - Invalid or missing API key</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <code className="px-2 py-1 bg-slate-200 rounded font-mono">403</code>
              <span className="text-slate-700">Forbidden - Access denied to resource</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <code className="px-2 py-1 bg-slate-200 rounded font-mono">404</code>
              <span className="text-slate-700">Not Found - Resource does not exist</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <code className="px-2 py-1 bg-slate-200 rounded font-mono">500</code>
              <span className="text-slate-700">Internal Server Error - Contact support</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}