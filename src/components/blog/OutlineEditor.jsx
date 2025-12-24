import React from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OutlineEditor({ outline, onChange }) {
  const handleAdd = (afterIndex) => {
    const newItem = {
      id: `outline-${Date.now()}`,
      text: 'New section',
      level: 2,
      order: afterIndex + 1
    };

    const updated = [
      ...outline.slice(0, afterIndex + 1),
      newItem,
      ...outline.slice(afterIndex + 1)
    ].map((item, idx) => ({ ...item, order: idx }));

    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = outline.filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, order: idx }));
    onChange(updated);
  };

  const handleTextChange = (index, newText) => {
    const updated = outline.map((item, idx) => 
      idx === index ? { ...item, text: newText } : item
    );
    onChange(updated);
  };

  const handleLevelChange = (index, delta) => {
    const updated = outline.map((item, idx) => 
      idx === index ? { ...item, level: Math.max(1, Math.min(4, item.level + delta)) } : item
    );
    onChange(updated);
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Article Outline</h3>
        <Button
          onClick={() => handleAdd(outline.length - 1)}
          size="sm"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Section
        </Button>
      </div>

      <div className="space-y-2">
        {outline.map((item, index) => (
          <div 
            key={item.id}
            className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-colors"
            style={{ marginLeft: `${(item.level - 1) * 20}px` }}
          >
            <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleLevelChange(index, -1)}
                className="w-6 h-6 text-slate-400 hover:text-slate-600"
                disabled={item.level === 1}
              >
                ←
              </button>
              <span className="text-xs text-slate-500 w-8 text-center">
                H{item.level}
              </span>
              <button
                onClick={() => handleLevelChange(index, 1)}
                className="w-6 h-6 text-slate-400 hover:text-slate-600"
                disabled={item.level === 4}
              >
                →
              </button>
            </div>

            <input
              type="text"
              value={item.text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-slate-900 font-medium"
            />

            <button
              onClick={() => handleRemove(index)}
              className="w-6 h-6 text-slate-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {outline.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No outline yet. Generate one using AI or add sections manually.
        </div>
      )}
    </div>
  );
}