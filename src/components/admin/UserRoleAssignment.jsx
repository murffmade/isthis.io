import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UserRoleAssignment() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => 
        u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchEmail.toLowerCase()))
      );
    },
    enabled: searchEmail.length >= 3
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }) => {
      await base44.entities.User.update(userId, { custom_role_id: roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Role assigned successfully');
      setSelectedUser(null);
      setSelectedRole('');
      setSearchEmail('');
    },
    onError: () => toast.error('Failed to assign role')
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, { custom_role_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Role removed successfully');
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to remove role')
  });

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both user and role');
      return;
    }
    assignRoleMutation.mutate({ userId: selectedUser.id, roleId: selectedRole });
  };

  const handleRemoveRole = () => {
    if (!selectedUser) return;
    if (window.confirm(`Remove custom role from ${selectedUser.email}?`)) {
      removeRoleMutation.mutate(selectedUser.id);
    }
  };

  const getUserCurrentRole = (user) => {
    if (!user.custom_role_id) return user.role; // Return system role (admin/user)
    const customRole = roles.find(r => r.id === user.custom_role_id);
    return customRole ? customRole.name : user.role;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6" />
          Assign Roles to Users
        </h2>
        <p className="text-slate-600">Search for users and assign custom roles</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {/* Search Users */}
        <div className="mb-6">
          <Label htmlFor="user-search">Search User</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="user-search"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Search by email or name..."
              className="pl-10"
            />
          </div>
        </div>

        {/* User Search Results */}
        {searchEmail.length >= 3 && users.length > 0 && (
          <div className="mb-6">
            <Label className="mb-2 block">Search Results</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedUser?.id === user.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{user.full_name || 'No name'}</div>
                      <div className="text-sm text-slate-600">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Current Role:</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {getUserCurrentRole(user)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchEmail.length >= 3 && users.length === 0 && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg text-center text-slate-600">
            No users found matching "{searchEmail}"
          </div>
        )}

        {/* Role Assignment */}
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200 mb-6"
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-900">
                    Assigning role to: {selectedUser.full_name || selectedUser.email}
                  </div>
                  <div className="text-sm text-slate-600">
                    Current: {getUserCurrentRole(selectedUser)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="role-select">Select New Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select" className="mt-2 bg-white">
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Default)</SelectItem>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  {roles.filter(r => r.is_active).map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} {role.is_system_role && '(System)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAssignRole}
                disabled={!selectedRole || assignRoleMutation.isPending}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Assign Role
              </Button>
              {selectedUser.custom_role_id && (
                <Button
                  onClick={handleRemoveRole}
                  disabled={removeRoleMutation.isPending}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Custom Role
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {roles.length === 0 && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
            <p className="text-amber-800 mb-2">No custom roles available</p>
            <p className="text-sm text-amber-700">
              Create custom roles in the Role Management section first
            </p>
          </div>
        )}
      </div>
    </div>
  );
}