import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Settings, TestTube2, Shield, Plus, Play, Pause, Trash2, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import CustomModelEditor from '@/components/enterprise/CustomModelEditor';
import PolicyEditor from '@/components/enterprise/PolicyEditor';
import ABTestDashboard from '@/components/enterprise/ABTestDashboard';

export default function EnterpriseAI() {
  const [activeTab, setActiveTab] = useState('models');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isEnterprise = currentUser?.role === 'admin'; // In production, check for enterprise subscription

  const tabs = [
    { id: 'models', label: 'Custom Models', icon: Brain },
    { id: 'policies', label: 'Moderation Policies', icon: Shield },
    { id: 'testing', label: 'A/B Testing', icon: TestTube2 }
  ];

  if (!isEnterprise) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Enterprise AI Customization</h1>
                  <p className="text-xs text-slate-500">Advanced Features</p>
                </div>
              </div>
              <Link to={createPageUrl('Home')}>
                <Button variant="outline" size="sm">Back</Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Enterprise Feature</h2>
          <p className="text-lg text-slate-600 mb-8">
            Custom AI model fine-tuning, moderation policies, and A/B testing are available for enterprise customers.
          </p>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            Contact Sales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Enterprise AI Customization</h1>
                <p className="text-xs text-slate-500">Fine-tune models, policies, and run experiments</p>
              </div>
            </div>
            <Link to={createPageUrl('Admin')}>
              <Button variant="outline" size="sm">Back to Admin</Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-b border-slate-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'models' && <CustomModelEditor />}
        {activeTab === 'policies' && <PolicyEditor />}
        {activeTab === 'testing' && <ABTestDashboard />}
      </main>
    </div>
  );
}