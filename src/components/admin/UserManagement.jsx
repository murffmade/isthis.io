import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Mail, Calendar, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  // Fetch all entitlements
  const { data: entitlements = [] } = useQuery({
    queryKey: ['admin-entitlements'],
    queryFn: () => base44.asServiceRole.entities.UserEntitlement.list()
  });

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: ({ email, role }) => base44.users.inviteUser(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User invited successfully');
    },
    onError: (error) => {
      toast.error(`Failed to invite user: ${error.message}`);
    }
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get entitlement for user
  const getUserEntitlement = (email) => {
    return entitlements.find(e => e.user_email === email);
  };

  const handleInviteUser = () => {
    const email = prompt('Enter email address:');
    if (!email) return;

    const role = confirm('Make this user an admin?') ? 'admin' : 'user';
    inviteMutation.mutate({ email, role });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-600 mt-1">Manage users and their access levels</p>
        </div>
        <Button onClick={handleInviteUser} className="bg-indigo-600 hover:bg-indigo-700">
          <Mail className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search users by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User List */}
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Subscription</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Joined</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => {
                const entitlement = getUserEntitlement(user.email);
                
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {entitlement ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={
                              entitlement.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : entitlement.status === 'past_due'
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                            }
                          >
                            {entitlement.plan_key}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {entitlement.status}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.created_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // View user details
                          alert(`User Details:\n\nEmail: ${user.email}\nName: ${user.full_name}\nRole: ${user.role}\nID: ${user.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}