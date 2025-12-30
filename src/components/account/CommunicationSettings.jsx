import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Phone, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CommunicationSettings({ currentUser, onUpdate, isUpdating }) {
  const preferences = currentUser?.preferences || {};
  const commSettings = currentUser?.communication_settings || {};

  const [settings, setSettings] = useState({
    email_notifications: preferences.email_notifications ?? true,
    push_notifications: preferences.push_notifications ?? true,
    marketing_emails: preferences.marketing_emails ?? false,
    weekly_digest: preferences.weekly_digest ?? true,
    security_alerts: preferences.security_alerts ?? true,
    contact_phone: commSettings.contact_phone || '',
    contact_email_secondary: commSettings.contact_email_secondary || '',
    preferred_contact_method: commSettings.preferred_contact_method || 'email',
    contact_hours: commSettings.contact_hours || 'anytime'
  });

  const handleSave = () => {
    onUpdate({
      preferences: {
        ...preferences,
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        marketing_emails: settings.marketing_emails,
        weekly_digest: settings.weekly_digest,
        security_alerts: settings.security_alerts
      },
      communication_settings: {
        contact_phone: settings.contact_phone,
        contact_email_secondary: settings.contact_email_secondary,
        preferred_contact_method: settings.preferred_contact_method,
        contact_hours: settings.contact_hours
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-slate-200 p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notifications & Communication
          </h2>
          <p className="text-sm text-slate-600 mt-1">Manage how we communicate with you</p>
        </div>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>

      {/* Notification Preferences */}
      <div className="mb-8">
        <h3 className="font-semibold text-slate-900 mb-4">Email Notifications</h3>
        <div className="space-y-3">
          {[
            { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive analysis results and updates via email', icon: Mail },
            { key: 'security_alerts', label: 'Security Alerts', desc: 'Critical security updates and login notifications', icon: Bell },
            { key: 'weekly_digest', label: 'Weekly Digest', desc: 'Weekly summary of your analysis activity', icon: MessageSquare },
            { key: 'marketing_emails', label: 'Marketing Emails', desc: 'Product updates, tips, and special offers', icon: Mail }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <label key={item.key} className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900">{item.label}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="mb-8 pb-8 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Push Notifications</h3>
        <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.push_notifications}
            onChange={(e) => setSettings({ ...settings, push_notifications: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-900">Browser Push Notifications</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">Get instant notifications in your browser</p>
          </div>
        </label>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-slate-600" />
              Phone Number (Optional)
            </Label>
            <Input
              type="tel"
              value={settings.contact_phone}
              onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-slate-600" />
              Secondary Email (Optional)
            </Label>
            <Input
              type="email"
              value={settings.contact_email_secondary}
              onChange={(e) => setSettings({ ...settings, contact_email_secondary: e.target.value })}
              placeholder="backup@example.com"
            />
          </div>

          <div>
            <Label className="mb-2">Preferred Contact Method</Label>
            <select
              value={settings.preferred_contact_method}
              onChange={(e) => setSettings({ ...settings, preferred_contact_method: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="email">Email Only</option>
              <option value="phone">Phone Only</option>
              <option value="both">Email & Phone</option>
            </select>
          </div>

          <div>
            <Label className="mb-2">Best Time to Contact</Label>
            <select
              value={settings.contact_hours}
              onChange={(e) => setSettings({ ...settings, contact_hours: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="anytime">Anytime</option>
              <option value="business_hours">Business Hours (9 AM - 5 PM)</option>
              <option value="evenings">Evenings (5 PM - 9 PM)</option>
              <option value="weekends">Weekends Only</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}