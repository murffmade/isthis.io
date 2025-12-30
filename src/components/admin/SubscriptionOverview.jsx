import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, Calendar, Loader2, Filter, ArrowUpDown, CheckCircle2, XCircle, Clock, AlertTriangle, Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SubscriptionOverview() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch all entitlements
  const { data: entitlements = [], isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => base44.asServiceRole.entities.UserEntitlement.list()
  });

  // Fetch users for names
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-sub'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  // Filter and sort entitlements
  const filteredEntitlements = entitlements
    .filter(ent => {
      const statusMatch = filterStatus === 'all' || ent.status === filterStatus;
      const planMatch = filterPlan === 'all' || ent.plan_key === filterPlan;
      return statusMatch && planMatch;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch(sortBy) {
        case 'user':
          aVal = getUserName(a.user_email).toLowerCase();
          bVal = getUserName(b.user_email).toLowerCase();
          break;
        case 'plan':
          aVal = a.plan_key;
          bVal = b.plan_key;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'started':
          aVal = new Date(a.started_at || 0);
          bVal = new Date(b.started_at || 0);
          break;
        case 'next_billing':
          aVal = new Date(a.current_period_end || 0);
          bVal = new Date(b.current_period_end || 0);
          break;
        default:
          aVal = new Date(a.created_date || 0);
          bVal = new Date(b.created_date || 0);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Calculate metrics
  const activeSubscriptions = entitlements.filter(e => e.status === 'active').length;
  const pastDueSubscriptions = entitlements.filter(e => e.status === 'past_due').length;
  const cancelledSubscriptions = entitlements.filter(e => e.status === 'canceled').length;
  const trialSubscriptions = entitlements.filter(e => e.status === 'trialing').length;
  
  // Calculate total MRR (simplified - actual calculation would need plan prices)
  const totalMRR = activeSubscriptions * 29; // Placeholder calculation

  // Get unique plans
  const uniquePlans = [...new Set(entitlements.map(e => e.plan_key))];

  // Get user name
  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  // Toggle sort
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const configs = {
      active: { icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
      past_due: { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-700', label: 'Past Due' },
      canceled: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
      trialing: { icon: Clock, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Trial' },
      pending: { icon: Clock, bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pending' }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${config.text}`} />
        <span className={`text-xs font-semibold ${config.text}`}>{config.label}</span>
      </div>
    );
  };

  // Get plan badge
  const getPlanBadge = (planKey) => {
    const isLifetime = planKey?.toLowerCase().includes('lifetime');
    const isAnnual = planKey?.toLowerCase().includes('annual');
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
        isLifetime 
          ? 'bg-purple-50 border-purple-200 text-purple-700'
          : isAnnual
          ? 'bg-blue-50 border-blue-200 text-blue-700'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        {isLifetime && <Crown className="w-3.5 h-3.5" />}
        {isAnnual && <Zap className="w-3.5 h-3.5" />}
        <span className="text-xs font-semibold">{planKey}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Subscription Overview</h2>
        <p className="text-sm text-slate-600 mt-1">Monitor all active subscriptions and billing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-900">{activeSubscriptions}</div>
          <div className="text-sm text-emerald-700 font-medium mt-1">Active Subscriptions</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-900">{pastDueSubscriptions}</div>
          <div className="text-sm text-amber-700 font-medium mt-1">Past Due</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900">{trialSubscriptions}</div>
          <div className="text-sm text-blue-700 font-medium mt-1">Trial Subscriptions</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-900">${totalMRR}</div>
          <div className="text-sm text-purple-700 font-medium mt-1">Est. Monthly Revenue</div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">✓ Active</option>
              <option value="past_due">⚠ Past Due</option>
              <option value="trialing">⏱ Trial</option>
              <option value="canceled">✗ Cancelled</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Plans</option>
              {uniquePlans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>

            {(filterStatus !== 'all' || filterPlan !== 'all') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPlan('all');
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredEntitlements.length}</span> of <span className="font-semibold text-slate-900">{entitlements.length}</span> subscriptions
          </div>
        </div>
      </div>

      {/* Subscription List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th 
                    className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => toggleSort('user')}
                  >
                    <div className="flex items-center gap-2">
                      User
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => toggleSort('plan')}
                  >
                    <div className="flex items-center gap-2">
                      Plan
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => toggleSort('started')}
                  >
                    <div className="flex items-center gap-2">
                      Start Date
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </th>
                  <th 
                    className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => toggleSort('next_billing')}
                  >
                    <div className="flex items-center gap-2">
                      Next Billing
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase">
                    Customer ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntitlements.map((entitlement) => (
                  <tr key={entitlement.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-indigo-700">
                            {getUserName(entitlement.user_email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{getUserName(entitlement.user_email)}</div>
                          <div className="text-sm text-slate-500">{entitlement.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPlanBadge(entitlement.plan_key)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(entitlement.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {entitlement.started_at ? new Date(entitlement.started_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {entitlement.current_period_end ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {new Date(entitlement.current_period_end).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {entitlement.stripe_customer_id ? (
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                          {entitlement.stripe_customer_id.substring(0, 20)}...
                        </code>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntitlements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No subscriptions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}