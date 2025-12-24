import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, MessageSquare, FileText, TrendingUp, DollarSign, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLES = {
  admin: {
    name: 'Admin',
    icon: Shield,
    color: 'from-purple-600 to-purple-800',
    permissions: ['all']
  },
  support_agent: {
    name: 'Support Agent',
    icon: MessageSquare,
    color: 'from-blue-600 to-blue-800',
    permissions: ['manage_tickets', 'view_users', 'send_notifications']
  },
  content_manager: {
    name: 'Content Manager',
    icon: FileText,
    color: 'from-emerald-600 to-emerald-800',
    permissions: ['manage_blog', 'manage_announcements', 'view_analytics']
  },
  trainer: {
    name: 'Trainer',
    icon: TrendingUp,
    color: 'from-amber-600 to-amber-800',
    permissions: ['manage_training', 'review_feedback', 'view_model_performance']
  },
  influencer_manager: {
    name: 'Influencer Manager',
    icon: DollarSign,
    color: 'from-pink-600 to-pink-800',
    permissions: ['manage_influencers', 'view_performance', 'manage_payouts']
  },
  user: {
    name: 'User',
    icon: Users,
    color: 'from-slate-600 to-slate-800',
    permissions: ['use_app']
  }
};

export default function RoleManagement() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users', searchEmail],
    queryFn: async () => {
      if (!searchEmail) return [];
      return await base44.entities.User.filter({ email: searchEmail });
    },
    enabled: searchEmail.length > 0
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      await base44.entities.User.update(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User role updated successfully');
    },
    onError: () => {
      toast.error('Failed to update user role');
    }
  });

  const handleUpdateRole = (role) => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({ userId: selectedUser.id, role });
  };

  return (
    <div className="space-y-6">
      {/* Role Overview */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Available Roles</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(ROLES).map(([key, role]) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${role.color} rounded-xl p-4 text-white`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-bold">{role.name}</div>
                </div>
                <div className="text-xs opacity-90 space-y-1">
                  {role.permissions.map((perm) => (
                    <div key={perm} className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{perm.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* User Search & Assignment */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Assign Role to User</h3>
        
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Search User by Email
          </label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
        </div>

        {/* User Results */}
        {users.length > 0 && (
          <div className="space-y-3 mb-6">
            {users.map((user) => {
              const userRole = ROLES[user.role] || ROLES.user;
              const Icon = userRole.icon;
              
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedUser?.id === user.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${userRole.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-slate-600">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{userRole.name}</div>
                      <div className="text-xs text-slate-500">Current Role</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Role Assignment */}
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-50 rounded-lg"
          >
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Assign New Role to {selectedUser.email}
            </label>
            <div className="flex gap-3">
              <Select onValueChange={handleUpdateRole} defaultValue={selectedUser.role}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {searchEmail && users.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No users found with that email
          </div>
        )}
      </div>
    </div>
  );
}

export { ROLES };