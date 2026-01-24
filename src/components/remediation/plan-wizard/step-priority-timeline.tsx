'use client';

/**
 * Step 2: Priority & Timeline
 *
 * Sets priority, risk level, target date, and ownership.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  PRIORITY_INFO,
  type Priority,
  type RiskLevel,
} from '@/lib/remediation/types';
import type { WizardData } from './index';
import { AlertCircle, Calendar, Euro, Tag, X } from 'lucide-react';
import { useState } from 'react';

interface StepPriorityTimelineProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
  teamMembers: Array<{ id: string; full_name: string; email: string }>;
}

export function StepPriorityTimeline({
  data,
  updateData,
  errors,
  teamMembers,
}: StepPriorityTimelineProps) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      updateData({ tags: [...data.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateData({ tags: data.tags.filter((t) => t !== tag) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6">
      {/* Priority and Risk Level */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Priority */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Priority <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.priority}
            onValueChange={(value) => updateData({ priority: value as Priority })}
          >
            <SelectTrigger className={cn(errors.priority && 'border-destructive')}>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_INFO) as Priority[]).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        priority === 'critical' && 'bg-destructive',
                        priority === 'high' && 'bg-orange-500',
                        priority === 'medium' && 'bg-yellow-500',
                        priority === 'low' && 'bg-blue-500'
                      )}
                    />
                    {PRIORITY_INFO[priority].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority[0]}</p>
          )}
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Associated Risk Level
            </div>
          </Label>
          <Select
            value={data.risk_level || 'none'}
            onValueChange={(value) =>
              updateData({ risk_level: value === 'none' ? undefined : value as RiskLevel })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="critical">Critical Risk</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The risk level if this gap is not remediated
          </p>
        </div>
      </div>

      {/* Target Date and Owner */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Target Date */}
        <div className="space-y-2">
          <Label htmlFor="target_date" className="text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Target Completion Date
            </div>
          </Label>
          <Input
            id="target_date"
            type="date"
            value={data.target_date || ''}
            onChange={(e) => updateData({ target_date: e.target.value || undefined })}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-sm text-muted-foreground">
            When should this plan be completed
          </p>
        </div>

        {/* Owner */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Plan Owner</Label>
          <Select
            value={data.owner_id || 'none'}
            onValueChange={(value) =>
              updateData({ owner_id: value === 'none' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not assigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Person responsible for this plan
          </p>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="estimated_cost" className="text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5" />
              Estimated Cost
            </div>
          </Label>
          <Input
            id="estimated_cost"
            type="number"
            min="0"
            placeholder="0"
            value={data.estimated_cost || ''}
            onChange={(e) =>
              updateData({
                estimated_cost: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
          <p className="text-sm text-muted-foreground">
            Projected budget for this remediation
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Currency</Label>
          <Select
            value={data.cost_currency}
            onValueChange={(value) => updateData({ cost_currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR (Euro)</SelectItem>
              <SelectItem value="USD">USD (US Dollar)</SelectItem>
              <SelectItem value="GBP">GBP (British Pound)</SelectItem>
              <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </div>
        </Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-2 text-sm font-medium text-primary hover:underline"
          >
            Add
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Add tags to categorize and filter plans
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Additional Notes
        </Label>
        <Textarea
          id="notes"
          placeholder="Any additional context, constraints, or considerations..."
          value={data.notes || ''}
          onChange={(e) => updateData({ notes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
