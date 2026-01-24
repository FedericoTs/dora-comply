'use client';

/**
 * Create Test Dialog Component
 *
 * Quick dialog for creating a new resilience test without navigating away.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createTestAction } from '@/lib/testing/actions';
import {
  TEST_TYPES,
  TESTER_TYPES,
  getTestTypeLabel,
  getTesterTypeLabel,
} from '@/lib/testing/types';
import type { TestType, TesterType } from '@/lib/testing/types';

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmeId?: string;
  onSuccess?: (testId: string) => void;
}

export function CreateTestDialog({
  open,
  onOpenChange,
  programmeId,
  onSuccess,
}: CreateTestDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: '',
    test_type: '' as TestType | '',
    description: '',
    planned_start_date: '',
    planned_end_date: '',
    tester_type: '' as TesterType | '',
    estimated_cost: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      test_type: '',
      description: '',
      planned_start_date: '',
      planned_end_date: '',
      tester_type: '',
      estimated_cost: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.test_type) {
      toast.error('Please fill in required fields');
      return;
    }

    startTransition(async () => {
      const input = {
        name: formData.name,
        test_type: formData.test_type as TestType,
        description: formData.description || undefined,
        planned_start_date: formData.planned_start_date || undefined,
        planned_end_date: formData.planned_end_date || undefined,
        tester_type: formData.tester_type ? (formData.tester_type as TesterType) : undefined,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
        programme_id: programmeId,
      };

      const result = await createTestAction(input);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Test created successfully');
        resetForm();
        onOpenChange(false);

        if (onSuccess) {
          onSuccess(result.test.id);
        } else {
          router.push(`/testing/tests/${result.test.id}`);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Create New Test
            </DialogTitle>
            <DialogDescription>
              Add a new resilience test per DORA Article 25.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Test Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Q1 2025 Pen Test"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_type">
                  Test Type <span className="text-error">*</span>
                </Label>
                <Select
                  value={formData.test_type}
                  onValueChange={(value) => setFormData({ ...formData, test_type: value as TestType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTestTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the test objectives..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planned_start_date">Start Date</Label>
                <Input
                  id="planned_start_date"
                  type="date"
                  value={formData.planned_start_date}
                  onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planned_end_date">End Date</Label>
                <Input
                  id="planned_end_date"
                  type="date"
                  value={formData.planned_end_date}
                  onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tester_type">Tester Type</Label>
                <Select
                  value={formData.tester_type}
                  onValueChange={(value) => setFormData({ ...formData, tester_type: value as TesterType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TESTER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTesterTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Est. Cost (EUR)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 15000"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Test'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
