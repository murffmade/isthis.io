import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PushNotifications() {
  const [permission, setPermission] = useState('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Show prompt if not decided yet and user has interacted
      const hasSeenPrompt = localStorage.getItem('notification-prompt-seen');
      if (!hasSeenPrompt && Notification.permission === 'default') {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem('notification-prompt-seen', 'true');
      setShowPrompt(false);

      if (result === 'granted') {
        toast.success('Notifications enabled!');
        // Show a test notification
        new Notification('IsThis.io', {
          body: 'You\'ll now receive updates about your verifications',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-seen', 'true');
  };

  // Don't render anything if notifications aren't supported
  if (!('Notification' in window)) {
    return null;
  }

  // Mobile prompt banner
  if (showPrompt && permission === 'default') {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl p-4 z-50 animate-slide-up">
        <button
          onClick={dismissPrompt}
          className="absolute top-2 right-2 p-1 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Stay Updated</h3>
            <p className="text-sm text-slate-300 mb-3">
              Get notified about your verification results
            </p>
            <Button
              onClick={requestPermission}
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Enable Notifications
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Helper function to send local notifications
export const sendNotification = (title, body, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
  return null;
};