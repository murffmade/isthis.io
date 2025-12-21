import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Key, Copy, Check, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function APIDocs() {
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});

  const queryClient = useQueryClient();

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => base44.entities.APIKey.list('-created_date')
  });

  const createKeyMutation = useMutation({
    mutationFn: async (keyName) => {
      const apiKey = `itr_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const hashedKey = btoa(apiKey); // In production, use proper hashing
      
      await base44.entities.APIKey.create({
        key_name: keyName,
        api_key: hashedKey,
        usage_count: 0,
        is_active: true
      });

      return apiKey; // Return the unhashed key to show to user
    },
    onSuccess: (apiKey) => {
      setGeneratedKey(apiKey);
      queryClient.invalidateQueries(['apiKeys']);
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id) => base44.entities.APIKey.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['apiKeys']);
      toast.success('API key deleted');
    }
  });

  const handleCreateKey = async (e) => {
    e.preventDefault();
    createKeyMutation.mutate(newKeyName);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const toggleKeyVisibility = (id) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500">API Documentation</p>
              </div>
            </a>
            <a
              href={createPageUrl('Enterprise')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Enterprise
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Enterprise Notice */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Enterprise API Access</h2>
              <p className="text-slate-300 mb-4">
                Integrate IsThis.io verification into your applications with our comprehensive REST API. 
                Access all verification modes programmatically with enterprise-grade reliability and support.
              </p>
              <a 
                href={createPageUrl('Enterprise')}
                className="inline-block px-6 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Documentation</h3>
              <nav className="space-y-2">
                {[
                  { label: 'API Keys', href: '#api-keys' },
                  { label: 'Authentication', href: '#authentication' },
                  { label: 'Endpoints', href: '#endpoints' },
                  { label: 'Rate Limits', href: '#rate-limits' },
                  { label: 'Webhooks', href: '#webhooks' },
                  { label: 'Error Codes', href: '#errors' }
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* API Keys Management */}
            <section id="api-keys" className="bg-white rounded-xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">API Keys</h2>
                  <p className="text-slate-600">Manage your API keys for authentication</p>
                </div>
                <Button
                  onClick={() => setShowNewKeyModal(true)}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Key
                </Button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No API keys yet. Create your first key to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-slate-900">{key.key_name}</h4>
                          {key.is_active ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <code className="font-mono">
                            {visibleKeys[key.id] ? atob(key.api_key) : '••••••••••••••••••••'}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {visibleKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {key.usage_count} requests • Last used: {key.last_used || 'Never'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteKeyMutation.mutate(key.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Authentication */}
            <section id="authentication" className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
              <p className="text-slate-600 mb-4">
                All API requests must include your API key in the Authorization header:
              </p>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-slate-300">
{`Authorization: Bearer YOUR_API_KEY`}
                </pre>
              </div>
            </section>

            {/* Endpoints */}
            <section id="endpoints" className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">API Endpoints</h2>
              <p className="text-slate-600 mb-6">Base URL: <code className="bg-slate-100 px-2 py-1 rounded text-sm">https://api.isthis.io</code></p>
              
              {/* Analyze Content - Real */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">POST</span>
                  <code className="text-sm font-mono text-slate-700">/v1/verify/real</code>
                </div>
                <p className="text-slate-600 mb-4">Detect AI-generated images, videos, and deepfakes.</p>
                
                <h4 className="font-semibold text-slate-900 mb-2">Request Body:</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto mb-4">
                  <pre className="text-sm text-slate-300">
{`{
  "input_type": "image",  // "image", "video", or "url"
  "input_value": "https://example.com/image.jpg",
  "context": "Optional context about the content"
}`}
                  </pre>
                </div>

                <h4 className="font-semibold text-slate-900 mb-2">Response:</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
{`{
  "id": "analysis_123abc",
  "mode": "real",
  "result": "likely_ai",
  "score": 87,
  "score_label": "High",
  "summary": "Content shows multiple signs of AI generation",
  "signals": [
    {
      "title": "Visual Artifacts",
      "description": "Detected anomalies in hand structure",
      "severity": "high"
    }
  ],
  "recommended_actions": [...],
  "created_at": "2024-12-21T10:30:00Z"
}`}
                  </pre>
                </div>
              </div>

              {/* Fact Check Endpoint */}
              <div className="mb-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">POST</span>
                  <code className="text-sm font-mono text-slate-700">/v1/verify/true</code>
                </div>
                <p className="text-slate-600 mb-4">Verify claims and check facts with citations.</p>
                
                <h4 className="font-semibold text-slate-900 mb-2">Request Body:</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto mb-4">
                  <pre className="text-sm text-slate-300">
{`{
  "input_type": "text",  // "text", "url", or "image"
  "input_value": "Scientists discovered a cure for the common cold",
  "context": "Saw this on social media"
}`}
                  </pre>
                </div>

                <h4 className="font-semibold text-slate-900 mb-2">Response:</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
{`{
  "id": "analysis_456def",
  "mode": "true",
  "score": 35,
  "score_label": "Likely False",
  "summary": "No credible evidence supports this claim",
  "signals": [...],
  "sources": [
    {
      "title": "Medical Research Update",
      "url": "https://example.com/article",
      "domain": "example.com",
      "date": "2024-12-15"
    }
  ],
  "recommended_actions": [...]
}`}
                  </pre>
                </div>
              </div>

              {/* Scam Detection Endpoint */}
              <div className="mb-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">POST</span>
                  <code className="text-sm font-mono text-slate-700">/v1/verify/scam</code>
                </div>
                <p className="text-slate-600 mb-4">Detect scams in messages, listings, and emails.</p>
                
                <h4 className="font-semibold text-slate-900 mb-2">Request Body:</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
{`{
  "input_type": "text",
  "input_value": "Congratulations! You've won $10,000...",
  "context": "Received via email"
}`}
                  </pre>
                </div>
              </div>

              {/* Safety Assessment Endpoint */}
              <div className="mb-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">POST</span>
                  <code className="text-sm font-mono text-slate-700">/v1/verify/safe</code>
                </div>
                <p className="text-slate-600 mb-4">Get safety guidance for situations and decisions.</p>
                
                <h4 className="font-semibold text-slate-900 mb-2">Request Body:</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
{`{
  "input_type": "text",
  "input_value": "Is it safe to use this supplement?",
  "context": "Found online, no FDA approval mentioned"
}`}
                  </pre>
                </div>
              </div>

              {/* Get Analysis */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">GET</span>
                  <code className="text-sm font-mono text-slate-700">/v1/analysis/:id</code>
                </div>
                <p className="text-slate-600">Retrieve a specific analysis result by ID.</p>
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks" className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Webhooks</h2>
              <p className="text-slate-600 mb-4">
                Subscribe to webhook events to receive real-time notifications when analyses complete.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Available Events:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• <code className="bg-white px-2 py-0.5 rounded">analysis.completed</code> - Analysis finished successfully</li>
                  <li>• <code className="bg-white px-2 py-0.5 rounded">analysis.failed</code> - Analysis encountered an error</li>
                </ul>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits" className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Rate Limits</h2>
              <p className="text-amber-600 text-sm mb-4 font-medium">⚠️ Enterprise-only feature</p>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-1">Starter Tier</h4>
                  <p className="text-slate-600">1,000 requests per hour • 10,000 per day</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-1">Professional Tier</h4>
                  <p className="text-slate-600">5,000 requests per hour • 50,000 per day</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-1">Enterprise Tier</h4>
                  <p className="text-slate-600">Custom rate limits based on your needs</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Contact sales for higher rate limits or custom SLAs.
              </p>
            </section>

            {/* Error Codes */}
            <section id="errors" className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Error Codes</h2>
              <div className="space-y-3">
                {[
                  { code: '401', desc: 'Unauthorized - Invalid API key' },
                  { code: '429', desc: 'Too Many Requests - Rate limit exceeded' },
                  { code: '400', desc: 'Bad Request - Invalid parameters' },
                  { code: '500', desc: 'Internal Server Error - Contact support' }
                ].map((error) => (
                  <div key={error.code} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <code className="font-mono font-bold text-slate-900">{error.code}</code>
                    <span className="text-slate-600">{error.desc}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            {!generatedKey ? (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Create New API Key</h3>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Key Name
                    </label>
                    <Input
                      placeholder="e.g., Production Server"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewKeyModal(false);
                        setNewKeyName('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-slate-900 hover:bg-slate-800"
                      disabled={createKeyMutation.isPending}
                    >
                      Create Key
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-2">API Key Created!</h3>
                <p className="text-sm text-amber-600 mb-4">
                  ⚠️ Save this key now - you won't be able to see it again!
                </p>
                <div className="bg-slate-900 rounded-lg p-4 mb-4">
                  <code className="text-sm text-slate-300 break-all">{generatedKey}</code>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => copyToClipboard(generatedKey)}
                    variant="outline"
                    className="flex-1"
                  >
                    {copiedKey ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copiedKey ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setGeneratedKey(null);
                      setNewKeyName('');
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800"
                  >
                    Done
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}