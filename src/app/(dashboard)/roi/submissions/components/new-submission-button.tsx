'use client';

/**
 * New Submission Button
 *
 * Handles creating a new RoI submission draft
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createSubmissionDraft } from '@/lib/roi/submissions';

// Generate reporting period options
function getReportingPeriodOptions() {
  const options: { value: string; label: string }[] = [];
  const currentYear = new Date().getFullYear();

  // Current year quarters
  for (let q = 1; q <= 4; q++) {
    options.push({
      value: `${currentYear}-Q${q}`,
      label: `${currentYear} Q${q}`,
    });
  }

  // Next year Q1
  options.push({
    value: `${currentYear + 1}-Q1`,
    label: `${currentYear + 1} Q1`,
  });

  // Annual option
  options.push({
    value: `${currentYear}-Annual`,
    label: `${currentYear} Annual`,
  });

  return options;
}

export function NewSubmissionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [reportingPeriod, setReportingPeriod] = useState('2025-Q1');

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const submission = await createSubmissionDraft(reportingPeriod);
      if (submission) {
        toast.success('Submission created', {
          description: `New submission draft for ${reportingPeriod} has been created.`,
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Failed to create submission', {
          description: 'Please try again or contact support.',
        });
      }
    } catch (error) {
      toast.error('Failed to create submission', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Submission
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Submission</DialogTitle>
          <DialogDescription>
            Start a new RoI submission draft for your organization. You can complete
            the submission over time and submit when ready.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reporting-period">Reporting Period</Label>
            <Select value={reportingPeriod} onValueChange={setReportingPeriod}>
              <SelectTrigger id="reporting-period">
                <SelectValue placeholder="Select reporting period" />
              </SelectTrigger>
              <SelectContent>
                {getReportingPeriodOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the reporting period this submission covers.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
