import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ArticleMetadata({ metadata, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Article Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Topic / Category</Label>
            <Input
              value={metadata.topic}
              onChange={(e) => onChange({ ...metadata, topic: e.target.value })}
              placeholder="e.g., AI Detection, Machine Learning"
            />
          </div>

          <div>
            <Label>Audience Level</Label>
            <Select 
              value={metadata.audience_level} 
              onValueChange={(value) => onChange({ ...metadata, audience_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tone</Label>
            <Select 
              value={metadata.tone} 
              onValueChange={(value) => onChange({ ...metadata, tone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select 
              value={metadata.status} 
              onValueChange={(value) => onChange({ ...metadata, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Learning Mode</Label>
            <Switch
              checked={metadata.learning_mode}
              onCheckedChange={(checked) => onChange({ ...metadata, learning_mode: checked })}
            />
          </div>
          <p className="text-xs text-slate-500">
            Add explanatory callouts and examples for educational content
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}