import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, Calendar, Loader2, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SubscriptionOverview() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

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

  // Filter entitlements
  const filteredEntitlements = entitlements.filter(ent => {
    const statusMatch = filterStatus === 'all' || ent.status === filterStatus;
    const planMatch = filterPlan === 'all' || ent.plan_key === filterPlan;
    return statusMatch && planMatch;
  });

  // Calculate metrics
  const activeSubscriptions = entitlements.filter(e => e.status === 'active').length;
  const pastDueSubscriptions = entitlements.filter(e => e.status === 'past_due').length;
  const cancelledSubscriptions = entitlements.filter(e => e.status === 'canceled').length;

  // Get unique plans
  const uniquePlans = [...new Set(entitlements.map(e => e.plan_key))];

  // Get user name
  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Subscription Overview</h2>
        <p className="text-sm text-slate-600 mt-1">Monitor all active subscriptions and billing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeSubscriptions}</div>
          <div className="text-sm text-slate-600 mt-1">Active Subscriptions</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{pastDueSubscriptions}</div>
          <div className="text-sm text-slate-600 mt-1">Past Due</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{cancelledSubscriptions}</div>
          <div className="text-sm text-slate-600 mt-1">Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Cancelled</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
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
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Subscription List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Started</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Next Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntitlements.map((entitlement) => (
                <tr key={entitlement.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{getUserName(entitlement.user_email)}</div>
                    <div className="text-sm text-slate-500">{entitlement.user_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{entitlement.plan_key}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      className={
                        entitlement.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : entitlement.status === 'past_due'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                      }
                    >
                      {entitlement.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {entitlement.started_at ? new Date(entitlement.started_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {entitlement.current_period_end ? new Date(entitlement.current_period_end).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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