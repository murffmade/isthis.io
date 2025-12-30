import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, TrendingUp, Activity, Loader2, CreditCard } from 'lucide-react';

export default function MetricsDashboard() {
  // Fetch all data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['metrics-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const { data: entitlements = [], isLoading: entitlementsLoading } = useQuery({
    queryKey: ['metrics-entitlements'],
    queryFn: () => base44.asServiceRole.entities.UserEntitlement.list()
  });

  const { data: analyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ['metrics-analyses'],
    queryFn: () => base44.asServiceRole.entities.AnalysisRecord.list()
  });

  const { data: planConfigs = [] } = useQuery({
    queryKey: ['metrics-plans'],
    queryFn: () => base44.asServiceRole.entities.PlanConfig.list()
  });

  const isLoading = usersLoading || entitlementsLoading || analysesLoading;

  // Calculate metrics
  const totalUsers = users.length;
  const activeSubscriptions = entitlements.filter(e => e.status === 'active').length;
  const totalAnalyses = analyses.length;

  // Calculate revenue (estimate based on active subscriptions)
  const estimatedRevenue = entitlements.reduce((sum, ent) => {
    if (ent.status !== 'active') return sum;
    const plan = planConfigs.find(p => p.plan_key === ent.plan_key);
    if (!plan) return sum;
    return sum + (plan.price_cents / 100);
  }, 0);

  // Calculate growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newUsersLast30Days = users.filter(u => 
    new Date(u.created_date) > thirtyDaysAgo
  ).length;

  const newAnalysesLast30Days = analyses.filter(a => 
    new Date(a.created_date) > thirtyDaysAgo
  ).length;

  // Plan breakdown
  const planBreakdown = {};
  entitlements.forEach(ent => {
    if (ent.status === 'active') {
      planBreakdown[ent.plan_key] = (planBreakdown[ent.plan_key] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Key Metrics</h2>
        <p className="text-sm text-slate-600 mt-1">Overview of your app's performance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold">${estimatedRevenue.toFixed(2)}</div>
              <div className="text-sm opacity-90 mt-1">Total Revenue (Est.)</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold">{totalUsers}</div>
              <div className="text-sm opacity-90 mt-1">Total Users</div>
              <div className="text-xs opacity-75 mt-2">+{newUsersLast30Days} in last 30 days</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold">{activeSubscriptions}</div>
              <div className="text-sm opacity-90 mt-1">Active Subscriptions</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold">{totalAnalyses}</div>
              <div className="text-sm opacity-90 mt-1">Total Analyses</div>
              <div className="text-xs opacity-75 mt-2">+{newAnalysesLast30Days} in last 30 days</div>
            </div>
          </div>

          {/* Plan Breakdown */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Plans Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(planBreakdown).map(([planKey, count]) => {
                const percentage = ((count / activeSubscriptions) * 100).toFixed(1);
                return (
                  <div key={planKey}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 capitalize">{planKey}</span>
                      <span className="text-sm text-slate-600">{count} users ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(planBreakdown).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No active plans</p>
              )}
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-2">Conversion Rate</div>
              <div className="text-2xl font-bold text-slate-900">
                {totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Users with paid plans</div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-2">Avg. Analyses per User</div>
              <div className="text-2xl font-bold text-slate-900">
                {totalUsers > 0 ? (totalAnalyses / totalUsers).toFixed(1) : 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Total analyses / users</div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-2">ARPU (Avg Revenue Per User)</div>
              <div className="text-2xl font-bold text-slate-900">
                ${totalUsers > 0 ? (estimatedRevenue / totalUsers).toFixed(2) : 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Est. revenue / user</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}