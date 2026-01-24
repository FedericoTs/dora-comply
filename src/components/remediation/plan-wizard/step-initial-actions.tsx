'use client';

/**
 * Step 3: Initial Actions
 *
 * Allows adding initial remediation actions to the plan.
 * This step is optional - users can skip and add actions later.
 */

import { useState } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ACTION_TYPE_INFO,
  PRIORITY_INFO,
  type ActionType,
  type Priority,
} from '@/lib/remediation/types';
import type { WizardData, WizardAction } from './index';

interface StepInitialActionsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
}

export function StepInitialActions({
  data,
  updateData,
  errors,
}: StepInitialActionsProps) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  const addAction = () => {
    const newAction: WizardAction = {
      id: `temp_${Date.now()}`,
      title: '',
      action_type: 'technical_control',
      priority: data.priority, // Inherit plan priority
      requires_evidence: false,
    };
    updateData({ actions: [...data.actions, newAction] });
    setExpandedActions((prev) => new Set([...prev, newAction.id]));
  };

  const removeAction = (actionId: string) => {
    updateData({ actions: data.actions.filter((a) => a.id !== actionId) });
    setExpandedActions((prev) => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
  };

  const updateAction = (actionId: string, updates: Partial<WizardAction>) => {
    updateData({
      actions: data.actions.map((a) =>
        a.id === actionId ? { ...a, ...updates } : a
      ),
    });
  };

  const toggleExpanded = (actionId: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground">
          Add the specific tasks needed to complete this remediation. You can add more actions
          after the plan is created. <strong>This step is optional.</strong>
        </p>
      </div>

      {/* Actions List */}
      {data.actions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No actions yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add tasks to break down the remediation into manageable steps
          </p>
          <Button onClick={addAction}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Action
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.actions.map((action, index) => {
            const isExpanded = expandedActions.has(action.id);
            const hasError = errors[`action_${index}_title`];

            return (
              <Card
                key={action.id}
                className={cn(hasError && 'border-destructive')}
              >
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(action.id)}>
                  <div className="flex items-center gap-2 p-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-mono text-muted-foreground w-6">
                      {index + 1}.
                    </span>

                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className={cn(
                          'font-medium truncate',
                          !action.title && 'text-muted-foreground italic'
                        )}>
                          {action.title || 'Untitled action'}
                        </span>
                      </button>
                    </CollapsibleTrigger>

                    <Badge variant="secondary" className="shrink-0">
                      {ACTION_TYPE_INFO[action.action_type].label}
                    </Badge>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAction(action.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 space-y-4 border-t">
                      {/* Title */}
                      <div className="space-y-2 pt-4">
                        <Label className="text-sm font-medium">
                          Action Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="e.g., Configure MFA for admin accounts"
                          value={action.title}
                          onChange={(e) => updateAction(action.id, { title: e.target.value })}
                          className={cn(hasError && 'border-destructive')}
                        />
                        {hasError && (
                          <p className="text-sm text-destructive">{errors[`action_${index}_title`][0]}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea
                          placeholder="Describe what needs to be done..."
                          value={action.description || ''}
                          onChange={(e) => updateAction(action.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {/* Action Type and Priority */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Action Type</Label>
                          <Select
                            value={action.action_type}
                            onValueChange={(value) =>
                              updateAction(action.id, { action_type: value as ActionType })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(ACTION_TYPE_INFO) as ActionType[]).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {ACTION_TYPE_INFO[type].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Priority</Label>
                          <Select
                            value={action.priority}
                            onValueChange={(value) =>
                              updateAction(action.id, { priority: value as Priority })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(PRIORITY_INFO) as Priority[]).map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {PRIORITY_INFO[priority].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Due Date and Estimated Hours */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Due Date</Label>
                          <Input
                            type="date"
                            value={action.due_date || ''}
                            onChange={(e) =>
                              updateAction(action.id, { due_date: e.target.value || undefined })
                            }
                            min={new Date().toISOString().split('T')[0]}
                            max={data.target_date}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Estimated Hours</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="0"
                            value={action.estimated_hours || ''}
                            onChange={(e) =>
                              updateAction(action.id, {
                                estimated_hours: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Requires Evidence */}
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Requires Evidence</Label>
                          <p className="text-xs text-muted-foreground">
                            Evidence must be uploaded to complete this action
                          </p>
                        </div>
                        <Switch
                          checked={action.requires_evidence}
                          onCheckedChange={(checked) =>
                            updateAction(action.id, { requires_evidence: checked })
                          }
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Action Button */}
      {data.actions.length > 0 && (
        <Button variant="outline" onClick={addAction} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Another Action
        </Button>
      )}
    </div>
  );
}
