import React, { useState, useEffect } from 'react';
import { X, Save, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const UserPreferences = base44.entities.UserPreferences;

export default function PreferencesModal({ isOpen, onClose, onSave }) {
  const [preferences, setPreferences] = useState({
    last_mode: 'real',
    risk_tolerance: 'medium',
    region: '',
    save_history: true
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (isOpen && initialLoad) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      const user = await base44.auth.me();
      const prefs = await UserPreferences.filter({ created_by: user.email });
      
      if (prefs && prefs.length > 0) {
        setPreferences({
          last_mode: prefs[0].last_mode || 'real',
          risk_tolerance: prefs[0].risk_tolerance || 'medium',
          region: prefs[0].region || '',
          save_history: prefs[0].save_history !== false
        });
      }
      setInitialLoad(false);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const existingPrefs = await UserPreferences.filter({ created_by: user.email });
      
      if (existingPrefs && existingPrefs.length > 0) {
        await UserPreferences.update(existingPrefs[0].id, preferences);
      } else {
        await UserPreferences.create(preferences);
      }
      
      toast.success('Preferences saved');
      if (onSave) onSave(preferences);
      onClose();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Preferences</h2>
                <p className="text-sm text-slate-500">Customize your experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Default Mode */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Default Verification Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'real', label: 'Is This Real?' },
                  { value: 'true', label: 'Is This True?' },
                  { value: 'scam', label: 'Is This a Scam?' },
                  { value: 'safe', label: 'Is This Safe?' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setPreferences({ ...preferences, last_mode: mode.value })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      preferences.last_mode === mode.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Tolerance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Risk Tolerance
              </label>
              <p className="text-xs text-slate-500 mb-3">
                How conservative should safety recommendations be?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'low', label: 'Cautious', desc: 'Most conservative' },
                  { value: 'medium', label: 'Balanced', desc: 'Standard approach' },
                  { value: 'high', label: 'Relaxed', desc: 'Less warnings' }
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setPreferences({ ...preferences, risk_tolerance: level.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      preferences.risk_tolerance === level.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-900">{level.label}</div>
                    <div className="text-xs text-slate-500">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Region (Optional)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                For localized guidance and relevant regulations
              </p>
              <input
                type="text"
                value={preferences.region}
                onChange={(e) => setPreferences({ ...preferences, region: e.target.value })}
                placeholder="e.g., United States, UK, EU"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Save History */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.save_history}
                  onChange={(e) => setPreferences({ ...preferences, save_history: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Save Analysis History</div>
                  <div className="text-xs text-slate-500">
                    Store your analyses for future reference (90 days)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}