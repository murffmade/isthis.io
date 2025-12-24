import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, TrendingUp, Activity, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: () => base44.entities.Subscription.list()
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses'],
    queryFn: () => base44.entities.AnalysisRecord.list('-created_date', 5000)
  });

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  // User Growth Data
  const userGrowthData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const newUsers = users.filter(u => {
        const userDate = format(new Date(u.created_date), 'yyyy-MM-dd');
        return userDate === dateStr;
      }).length;

      const totalUsers = users.filter(u => new Date(u.created_date) <= date).length;
      
      data.push({
        date: format(date, 'MMM dd'),
        new_users: newUsers,
        total_users: totalUsers
      });
    }
    
    return data;
  }, [users, days]);

  // Revenue Data
  const revenueData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dailyRevenue = subscriptions.filter(s => {
        const subDate = format(new Date(s.purchased_at || s.created_date), 'yyyy-MM-dd');
        return subDate === dateStr;
      }).reduce((sum, s) => sum + (s.amount_paid || 0) / 100, 0);
      
      data.push({
        date: format(date, 'MMM dd'),
        revenue: parseFloat(dailyRevenue.toFixed(2))
      });
    }
    
    return data;
  }, [subscriptions, days]);

  // Role Distribution
  const roleDistribution = React.useMemo(() => {
    const roles = {};
    users.forEach(u => {
      const role = u.role || 'user';
      roles[role] = (roles[role] || 0) + 1;
    });
    
    return Object.entries(roles).map(([name, value]) => ({ name, value }));
  }, [users]);

  // Feature Usage
  const featureUsage = React.useMemo(() => {
    const usage = {
      'Image Analysis': analyses.filter(a => a.content_type === 'image').length,
      'Video Analysis': analyses.filter(a => a.content_type === 'video').length,
      'URL Analysis': analyses.filter(a => a.content_type === 'url').length
    };
    
    return Object.entries(usage).map(([name, value]) => ({ name, value }));
  }, [analyses]);

  // Stats
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0) / 100, 0);
  const monthlyRecurring = subscriptions.filter(s => s.plan === 'annual' && s.status === 'active').length * 29;
  const avgRevenuePerUser = users.length > 0 ? totalRevenue / users.length : 0;
  const activeRate = users.length > 0 ? (analyses.filter(a => {
    const daysSince = (new Date() - new Date(a.created_date)) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length / users.length * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Platform Analytics</h3>
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div className="text-sm text-slate-600">Total Revenue</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">All time</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-slate-600">MRR</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">${monthlyRecurring.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">Monthly recurring</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div className="text-sm text-slate-600">ARPU</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">${avgRevenuePerUser.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">Avg revenue per user</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <div className="text-sm text-slate-600">Active Rate</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Last 7 days</div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="font-bold text-slate-900 mb-4">User Growth</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
              <Tooltip />
              <Line type="monotone" dataKey="new_users" stroke="#4f46e5" name="New Users" strokeWidth={2} />
              <Line type="monotone" dataKey="total_users" stroke="#10b981" name="Total Users" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="font-bold text-slate-900 mb-4">Revenue Trend</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Role Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="font-bold text-slate-900 mb-4">User Roles</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Feature Usage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="font-bold text-slate-900 mb-4">Feature Usage</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={featureUsage} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" style={{ fontSize: '11px' }} />
              <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: '11px' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}