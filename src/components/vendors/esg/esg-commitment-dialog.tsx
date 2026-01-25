'use client';

/**
 * ESG Commitment Dialog Component
 *
 * Form for adding ESG commitments/goals to a vendor
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { COMMITMENT_LABELS, type CommitmentType } from '@/lib/esg/types';

interface ESGCommitmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  onSuccess?: () => void;
}

const commitmentSchema = z.object({
  commitment_type: z.string().min(1, 'Commitment type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  target_date: z.string().optional(),
  target_value: z.string().optional(),
  current_progress: z.number().min(0).max(100),
  source_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type CommitmentFormData = z.infer<typeof commitmentSchema>;

export function ESGCommitmentDialog({
  open,
  onOpenChange,
  vendorId,
  onSuccess,
}: ESGCommitmentDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CommitmentFormData>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      commitment_type: '',
      title: '',
      description: '',
      target_date: '',
      target_value: '',
      current_progress: 0,
      source_url: '',
      notes: '',
    },
  });

  const progress = form.watch('current_progress');

  const onSubmit = async (data: CommitmentFormData) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/vendors/${vendorId}/esg/commitments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          target_date: data.target_date || null,
          source_url: data.source_url || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to add commitment');

      toast.success('ESG commitment has been added successfully.');

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to add commitment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Add ESG Commitment
          </DialogTitle>
          <DialogDescription>
            Record a sustainability commitment or goal
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="commitment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commitment Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commitment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(COMMITMENT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Net Zero by 2030" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the commitment in detail..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="target_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 50% reduction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="current_progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Progress: {progress}%</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0])}
                      min={0}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                  </FormControl>
                  <FormDescription>
                    How much progress has been made towards this goal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to public announcement or documentation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Commitment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
