import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Globe, Pencil, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ProfileSettings({ currentUser, onUpdate, isUpdating }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    full_name: currentUser?.full_name || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
    timezone: currentUser?.timezone || '',
    language: currentUser?.language || 'en'
  });

  const handleSave = () => {
    onUpdate(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData({
      full_name: currentUser?.full_name || '',
      bio: currentUser?.bio || '',
      location: currentUser?.location || '',
      timezone: currentUser?.timezone || '',
      language: currentUser?.language || 'en'
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-slate-200 p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating} size="sm">
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-slate-600" />
            Full Name
          </Label>
          {isEditing ? (
            <Input
              value={editedData.full_name}
              onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
              placeholder="Enter your full name"
            />
          ) : (
            <div className="text-slate-900 font-medium">{currentUser?.full_name || 'Not set'}</div>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-slate-600" />
            Email
          </Label>
          <div className="text-slate-900 font-medium">{currentUser?.email}</div>
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-slate-600" />
            Location
          </Label>
          {isEditing ? (
            <Input
              value={editedData.location}
              onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
              placeholder="City, Country"
            />
          ) : (
            <div className="text-slate-900 font-medium">{currentUser?.location || 'Not set'}</div>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-slate-600" />
            Timezone
          </Label>
          {isEditing ? (
            <select
              value={editedData.timezone}
              onChange={(e) => setEditedData({ ...editedData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">Select timezone</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          ) : (
            <div className="text-slate-900 font-medium">{currentUser?.timezone || 'Not set'}</div>
          )}
        </div>

        <div className="md:col-span-2">
          <Label className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-slate-600" />
            Bio
          </Label>
          {isEditing ? (
            <Textarea
              value={editedData.bio}
              onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          ) : (
            <div className="text-slate-900">{currentUser?.bio || 'No bio set'}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}