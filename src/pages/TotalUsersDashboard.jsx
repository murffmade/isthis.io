import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, Crown, Ban, Pause, Play, Mail, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TotalUsersDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  // Fetch all users
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      await base44.entities.User.update(userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success('User updated successfully');
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Failed to update user');
    }
  });

  // Filter users based on search
  const filteredUsers = allUsers.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateUser = (userId, updates) => {
    updateUserMutation.mutate({ userId, updates });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">You must be an admin to access this page.</p>
          <Button onClick={() => window.location.href = createPageUrl('Home')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Admin')}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800 leading-tight">Total Users Dashboard</h1>
                  <p className="text-xs text-slate-500">{allUsers.length} registered users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* User List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-600">Loading users...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{user.full_name || 'No name'}</h3>
                        {user.role === 'admin' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {user.role === 'trainer' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Trainer
                          </span>
                        )}
                        {user.account_status === 'deactivated' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Deactivated
                          </span>
                        )}
                        {user.account_status === 'paused' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            Paused
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(user.created_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {user.account_status !== 'deactivated' && user.account_status !== 'paused' && (
                      <Button
                        onClick={() => handleUpdateUser(user.id, { account_status: 'paused' })}
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:bg-amber-50"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    
                    {user.account_status === 'paused' && (
                      <Button
                        onClick={() => handleUpdateUser(user.id, { account_status: 'active' })}
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}

                    {user.account_status !== 'deactivated' && user.id !== currentUser.id && (
                      <Button
                        onClick={() => handleUpdateUser(user.id, { account_status: 'deactivated' })}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Deactivate
                      </Button>
                    )}

                    {user.account_status === 'deactivated' && (
                      <Button
                        onClick={() => handleUpdateUser(user.id, { account_status: 'active' })}
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Reactivate
                      </Button>
                    )}

                    {user.role !== 'admin' && user.id !== currentUser.id && (
                      <Button
                        onClick={() => handleUpdateUser(user.id, { role: 'admin' })}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 hover:bg-purple-50"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Make Admin
                      </Button>
                    )}

                    {user.role === 'admin' && user.id !== currentUser.id && (
                      <Button
                        onClick={() => handleUpdateUser(user.id, { role: 'user' })}
                        variant="outline"
                        size="sm"
                      >
                        Remove Admin
                      </Button>
                    )}

                    {user.role !== 'trainer' && user.role !== 'admin' && (
                      <Button
                        onClick={() => handleUpdateUser(user.id, { role: 'trainer' })}
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Make Trainer
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No users found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}