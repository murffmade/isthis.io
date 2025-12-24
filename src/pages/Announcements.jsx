import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Send, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Announcements() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [notificationType, setNotificationType] = useState('system_update');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin'
  });

  const { data: influencers = [] } = useQuery({
    queryKey: ['allInfluencers'],
    queryFn: () => base44.entities.InfluencerPartner.list(),
    enabled: user?.role === 'admin'
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async () => {
      let targetUsers = [];
      
      if (audience === 'all') {
        targetUsers = allUsers.map(u => u.email);
      } else if (audience === 'influencers') {
        targetUsers = influencers.map(i => i.created_by);
      } else if (audience === 'premium') {
        // Would need to filter based on subscription
        targetUsers = allUsers.filter(u => u.email).map(u => u.email);
      }

      // Create notifications for all target users
      const notifications = targetUsers.map(email => 
        base44.entities.Notification.create({
          user_email: email,
          type: notificationType,
          title: title,
          message: message,
          read: false
        })
      );

      await Promise.all(notifications);
      return targetUsers.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['notifications']);
      toast.success(`Announcement sent to ${count} users!`);
      setTitle('');
      setMessage('');
    },
    onError: () => {
      toast.error('Failed to send announcement');
    }
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-6">
        <div className="glass-effect rounded-3xl p-8 text-center shadow-medium max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Admin Only</h2>
          <p className="text-slate-600">You need admin access to send announcements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <header className="glass-effect sticky top-0 z-50 shadow-soft">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Send Announcement</h1>
              <p className="text-sm text-slate-600 font-medium">Notify users about updates and features</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8 shadow-medium"
        >
          <div className="space-y-6">
            {/* Audience Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                <Users className="w-4 h-4 inline mr-1" />
                Target Audience
              </label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users ({allUsers.length})</SelectItem>
                  <SelectItem value="influencers">Influencers Only ({influencers.length})</SelectItem>
                  <SelectItem value="premium">Premium Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification Type */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Notification Type
              </label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_update">System Update</SelectItem>
                  <SelectItem value="feature_announcement">New Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Title
              </label>
              <Input
                placeholder="e.g., New AI Detection Model Released!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Message
              </label>
              <Textarea
                placeholder="Write your announcement message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-32"
              />
              <p className="text-xs text-slate-500 mt-1">
                This will be shown in users' notification center
              </p>
            </div>

            {/* Preview */}
            {title && message && (
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <p className="text-xs font-semibold text-indigo-700 mb-2">Preview</p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
                      <p className="text-xs text-slate-600">{message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={() => sendAnnouncementMutation.mutate()}
              disabled={!title || !message || sendAnnouncementMutation.isPending}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-bold shadow-lg button-shine"
            >
              <Send className="w-5 h-5 mr-2" />
              {sendAnnouncementMutation.isPending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}