import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Shield, User, Settings, FileText, DollarSign, Search, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const actionIcons = {
  content_created: FileText,
  content_updated: FileText,
  content_deleted: FileText,
  user_role_changed: User,
  settings_updated: Settings,
  payout_processed: DollarSign,
  analysis_created: Shield,
  feedback_submitted: FileText,
  article_published: FileText,
  user_invited: User,
  subscription_changed: DollarSign
};

const actionColors = {
  content_created: 'bg-emerald-100 text-emerald-700',
  content_updated: 'bg-blue-100 text-blue-700',
  content_deleted: 'bg-red-100 text-red-700',
  user_role_changed: 'bg-purple-100 text-purple-700',
  settings_updated: 'bg-amber-100 text-amber-700',
  payout_processed: 'bg-green-100 text-green-700',
  analysis_created: 'bg-indigo-100 text-indigo-700',
  feedback_submitted: 'bg-cyan-100 text-cyan-700',
  article_published: 'bg-pink-100 text-pink-700',
  user_invited: 'bg-violet-100 text-violet-700',
  subscription_changed: 'bg-teal-100 text-teal-700'
};

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 200)
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesResource = filterResource === 'all' || log.resource_type === filterResource;

    return matchesSearch && matchesAction && matchesResource;
  });

  const uniqueResources = [...new Set(logs.map(l => l.resource_type))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3498DB]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Audit Trail</h2>
        <p className="text-slate-600">Monitor all significant actions and changes in the system</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by user, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="content_created">Content Created</SelectItem>
              <SelectItem value="content_updated">Content Updated</SelectItem>
              <SelectItem value="content_deleted">Content Deleted</SelectItem>
              <SelectItem value="user_role_changed">Role Changed</SelectItem>
              <SelectItem value="settings_updated">Settings Updated</SelectItem>
              <SelectItem value="payout_processed">Payout Processed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterResource} onValueChange={setFilterResource}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {uniqueResources.map(resource => (
                <SelectItem key={resource} value={resource}>{resource}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Events</div>
          <div className="text-2xl font-bold text-slate-900">{logs.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Today</div>
          <div className="text-2xl font-bold text-slate-900">
            {logs.filter(l => new Date(l.created_date).toDateString() === new Date().toDateString()).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">This Week</div>
          <div className="text-2xl font-bold text-slate-900">
            {logs.filter(l => {
              const logDate = new Date(l.created_date);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return logDate > weekAgo;
            }).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Unique Users</div>
          <div className="text-2xl font-bold text-slate-900">
            {new Set(logs.map(l => l.user_email)).size}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => {
                  const Icon = actionIcons[log.action] || Shield;
                  const colorClass = actionColors[log.action] || 'bg-slate-100 text-slate-700';

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="text-sm text-slate-600">
                                {log.resource_type} {log.resource_id && `• ID: ${log.resource_id.substring(0, 8)}...`}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm text-slate-900">
                                {new Date(log.created_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(log.created_date).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.user_email}
                            </span>
                            {log.user_role && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                {log.user_role}
                              </span>
                            )}
                          </div>

                          {log.details && Object.keys(log.details).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-[#3498DB] cursor-pointer hover:underline">
                                View details
                              </summary>
                              <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}