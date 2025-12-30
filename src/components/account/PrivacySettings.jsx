import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Globe, Users, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function PrivacySettings({ currentUser, onUpdate, isUpdating }) {
  const [visibility, setVisibility] = useState(currentUser?.profile_visibility || 'private');
  const [autoSave, setAutoSave] = useState(currentUser?.preferences?.analysis_auto_save ?? true);
  const [theme, setTheme] = useState(currentUser?.preferences?.theme || 'auto');

  const handleSave = () => {
    onUpdate({
      profile_visibility: visibility,
      preferences: {
        ...currentUser?.preferences,
        analysis_auto_save: autoSave,
        theme: theme
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
            <Lock className="w-6 h-6" />
            Privacy & Preferences
          </h2>
          <p className="text-sm text-slate-600 mt-1">Control your privacy and app preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility */}
        <div>
          <Label className="mb-3 block font-semibold text-slate-900">Profile Visibility</Label>
          <div className="space-y-2">
            {[
              { value: 'private', icon: EyeOff, label: 'Private', desc: 'Only you can see your profile' },
              { value: 'connections_only', icon: Users, label: 'Connections Only', desc: 'Only users you interact with' },
              { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can view your profile' }
            ].map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    visibility === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <span className="font-medium text-slate-900">{option.label}</span>
                    </div>
                    <p className="text-sm text-slate-600">{option.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* App Preferences */}
        <div className="pt-6 border-t border-slate-200">
          <Label className="mb-3 block font-semibold text-slate-900">App Preferences</Label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 mt-0.5"
              />
              <div className="flex-1">
                <span className="font-medium text-slate-900">Auto-save Analysis History</span>
                <p className="text-sm text-slate-600 mt-1">Automatically save your verifications for future reference</p>
              </div>
            </label>

            <div>
              <Label className="mb-2 block">Theme</Label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}