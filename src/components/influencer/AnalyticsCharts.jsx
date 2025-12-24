import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsCharts({ clicks }) {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  // Generate daily data
  const dailyData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayClicks = clicks.filter(c => {
        const clickDate = format(new Date(c.created_date), 'yyyy-MM-dd');
        return clickDate === dateStr;
      });
      
      const conversions = dayClicks.filter(c => c.converted).length;
      const earnings = dayClicks.reduce((sum, c) => sum + (c.conversion_value || 0), 0) * 0.3;
      
      data.push({
        date: format(date, 'MMM dd'),
        clicks: dayClicks.length,
        conversions,
        earnings: parseFloat(earnings.toFixed(2))
      });
    }
    
    return data;
  }, [clicks, days]);

  // Conversion by type
  const conversionData = React.useMemo(() => {
    const converted = clicks.filter(c => c.converted);
    
    // Group by conversion value ranges
    const ranges = {
      'Basic ($9.99)': 0,
      'Premium ($29)': 0,
      'Lifetime ($99)': 0,
      'Other': 0
    };
    
    converted.forEach(c => {
      const value = c.conversion_value || 0;
      if (value >= 9 && value <= 10) ranges['Basic ($9.99)']++;
      else if (value >= 28 && value <= 30) ranges['Premium ($29)']++;
      else if (value >= 98 && value <= 100) ranges['Lifetime ($99)']++;
      else ranges['Other']++;
    });
    
    return Object.entries(ranges)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [clicks]);

  // Top performing days
  const topDays = React.useMemo(() => {
    return [...dailyData]
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);
  }, [dailyData]);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Performance Analytics</h3>
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

      {/* Clicks & Conversions Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h4 className="font-bold text-slate-900">Clicks & Conversions Trend</h4>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="clicks" 
              stroke="#4f46e5" 
              strokeWidth={2}
              name="Clicks"
              dot={{ fill: '#4f46e5', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="conversions" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Conversions"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Earnings Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-slate-900">Earnings by Day</h4>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '11px' }}
              />
              <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => `$${value}`}
              />
              <Bar dataKey="earnings" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Conversion Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-slate-900">Conversions by Plan</h4>
          </div>
          
          {conversionData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              No conversion data yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Performing Days */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <h4 className="font-bold text-slate-900 mb-4">Top Performing Days</h4>
        <div className="space-y-3">
          {topDays.map((day, idx) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-slate-100 text-slate-700' :
                  idx === 2 ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-50 text-slate-600'
                }`}>
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{day.date}</div>
                  <div className="text-sm text-slate-600">
                    {day.clicks} clicks • {day.conversions} conversions
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold text-emerald-600">
                ${day.earnings.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}