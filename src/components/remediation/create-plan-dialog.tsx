'use client';

/**
 * Create Plan Dialog Component
 *
 * Dialog for creating new remediation plans.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { createRemediationPlan } from '@/lib/remediation/actions';
import {
  SOURCE_TYPE_INFO,
  PRIORITY_INFO,
  type SourceType,
  type Priority,
  type Framework,
} from '@/lib/remediation/types';
import { toast } from 'sonner';

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: string;
  sourceType?: SourceType;
  sourceId?: string;
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  vendorId,
  sourceType: initialSourceType,
  sourceId,
}: CreatePlanDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [sourceType, setSourceType] = useState<SourceType>(initialSourceType || 'manual');
  const [framework, setFramework] = useState<Framework | ''>('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a plan title');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRemediationPlan({
        title: title.trim(),
        description: description.trim() || undefined,
        source_type: sourceType,
        source_id: sourceId,
        vendor_id: vendorId,
        framework: framework || undefined,
        priority,
        target_date: targetDate || undefined,
      });

      if (result.success && result.planId) {
        toast.success('Remediation plan created');
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('medium');
        setSourceType('manual');
        setFramework('');
        setTargetDate('');
        onOpenChange(false);
        // Navigate to the new plan
        router.push(`/remediation/${result.planId}`);
      } else {
        toast.error(result.error || 'Failed to create plan');
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
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Remediation Plan</DialogTitle>
            <DialogDescription>
              Create a new plan to track and remediate compliance gaps.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Plan Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Implement MFA across all systems"
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
                placeholder="Describe the remediation objectives and scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Source Type and Priority row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Source Type */}
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select
                  value={sourceType}
                  onValueChange={(value) => setSourceType(value as SourceType)}
                  disabled={isSubmitting || !!initialSourceType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SOURCE_TYPE_INFO) as SourceType[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SOURCE_TYPE_INFO[s].label}
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

            {/* Framework and Target Date row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Framework */}
              <div className="grid gap-2">
                <Label>Framework</Label>
                <Select
                  value={framework}
                  onValueChange={(value) => setFramework(value as Framework | '')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General</SelectItem>
                    <SelectItem value="nis2">NIS2</SelectItem>
                    <SelectItem value="dora">DORA</SelectItem>
                    <SelectItem value="iso27001">ISO 27001</SelectItem>
                    <SelectItem value="soc2">SOC 2</SelectItem>
                    <SelectItem value="gdpr">GDPR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Date */}
              <div className="grid gap-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
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
              Create Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
