'use client';

/**
 * Create Action Dialog Component
 *
 * Dialog for creating new remediation actions within a plan.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createRemediationAction } from '@/lib/remediation/actions';
import {
  ACTION_TYPE_INFO,
  PRIORITY_INFO,
  type ActionType,
  type Priority,
} from '@/lib/remediation/types';
import { toast } from 'sonner';

interface CreateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
}

export function CreateActionDialog({
  open,
  onOpenChange,
  planId,
}: CreateActionDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<ActionType>('other');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [requiresEvidence, setRequiresEvidence] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [requirementReference, setRequirementReference] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter an action title');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRemediationAction({
        plan_id: planId,
        title: title.trim(),
        description: description.trim() || undefined,
        action_type: actionType,
        priority,
        due_date: dueDate || undefined,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        requires_evidence: requiresEvidence,
        evidence_description: requiresEvidence ? evidenceDescription.trim() || undefined : undefined,
        requirement_reference: requirementReference.trim() || undefined,
      });

      if (result.success) {
        toast.success('Action created');
        // Reset form
        setTitle('');
        setDescription('');
        setActionType('other');
        setPriority('medium');
        setDueDate('');
        setEstimatedHours('');
        setRequiresEvidence(false);
        setEvidenceDescription('');
        setRequirementReference('');
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create action');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Action</DialogTitle>
            <DialogDescription>
              Create a new action item for this remediation plan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Action Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Configure MFA for admin accounts"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what needs to be done..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Action Type and Priority row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Action Type */}
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={actionType}
                  onValueChange={(value) => setActionType(value as ActionType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTION_TYPE_INFO) as ActionType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {ACTION_TYPE_INFO[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as Priority)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_INFO) as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_INFO[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date and Estimated Hours row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Estimated Hours */}
              <div className="grid gap-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g., 4"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Requirement Reference */}
            <div className="grid gap-2">
              <Label htmlFor="requirement_reference">Requirement Reference</Label>
              <Input
                id="requirement_reference"
                placeholder="e.g., DORA Art. 5(2)(a), NIS2 Art. 21"
                value={requirementReference}
                onChange={(e) => setRequirementReference(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Evidence Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Requires Evidence</Label>
                <p className="text-sm text-muted-foreground">
                  This action requires documented evidence for verification
                </p>
              </div>
              <Switch
                checked={requiresEvidence}
                onCheckedChange={setRequiresEvidence}
                disabled={isSubmitting}
              />
            </div>

            {/* Evidence Description (shown when requires evidence) */}
            {requiresEvidence && (
              <div className="grid gap-2">
                <Label htmlFor="evidence_description">Evidence Description</Label>
                <Textarea
                  id="evidence_description"
                  placeholder="Describe what evidence is needed (e.g., screenshot of MFA settings, audit log export)..."
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
