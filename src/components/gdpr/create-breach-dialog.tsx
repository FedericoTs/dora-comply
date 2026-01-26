'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { createBreach } from '@/lib/gdpr/actions';
import {
  BREACH_SEVERITY_LABELS,
  COMMON_BREACH_TYPES,
  COMMON_DATA_CATEGORIES,
  type BreachSeverity,
} from '@/lib/gdpr/types';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  detected_at: z.string().min(1, 'Detection date is required'),
  detected_by: z.string().optional(),
  breach_type: z.array(z.string()).min(1, 'At least one breach type is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical'] as const),
  data_categories_affected: z.array(z.string()),
  estimated_records_affected: z.number().optional(),
  data_subjects_affected: z.array(z.string()),
});

type FormData = z.infer<typeof formSchema>;

interface CreateBreachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBreachDialog({ open, onOpenChange, onSuccess }: CreateBreachDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      detected_at: new Date().toISOString().slice(0, 16),
      detected_by: '',
      breach_type: [],
      severity: 'medium',
      data_categories_affected: [],
      estimated_records_affected: undefined,
      data_subjects_affected: [],
    },
  });

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createBreach({
        title: data.title,
        description: data.description,
        detected_at: new Date(data.detected_at).toISOString(),
        detected_by: data.detected_by || undefined,
        breach_type: data.breach_type,
        severity: data.severity,
        data_categories_affected: data.data_categories_affected,
        estimated_records_affected: data.estimated_records_affected,
        data_subjects_affected: data.data_subjects_affected,
      });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to create breach:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBreachType = (type: string) => {
    const current = form.getValues('breach_type');
    if (current.includes(type)) {
      form.setValue('breach_type', current.filter((t) => t !== type));
    } else {
      form.setValue('breach_type', [...current, type]);
    }
  };

  const toggleDataCategory = (category: string) => {
    const current = form.getValues('data_categories_affected');
    if (current.includes(category)) {
      form.setValue('data_categories_affected', current.filter((c) => c !== category));
    } else {
      form.setValue('data_categories_affected', [...current, category]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report Data Breach
          </DialogTitle>
          <DialogDescription>
            Document a personal data breach. You have 72 hours from detection to notify the supervisory authority if required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Breach Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Unauthorized access to customer database"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened, how it was detected, and initial assessment..."
                rows={3}
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detected_at">Detection Date/Time *</Label>
                <Input
                  id="detected_at"
                  type="datetime-local"
                  {...form.register('detected_at')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detected_by">Detected By</Label>
                <Input
                  id="detected_by"
                  placeholder="e.g., Security team"
                  {...form.register('detected_by')}
                />
              </div>
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label>Severity *</Label>
            <Select
              value={form.watch('severity')}
              onValueChange={(value) => form.setValue('severity', value as BreachSeverity)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BREACH_SEVERITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Breach Type */}
          <div className="space-y-4">
            <Label>Breach Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_BREACH_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={form.watch('breach_type').includes(type)}
                    onCheckedChange={() => toggleBreachType(type)}
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
            {form.formState.errors.breach_type && (
              <p className="text-xs text-destructive">{form.formState.errors.breach_type.message}</p>
            )}
          </div>

          {/* Affected Data */}
          <div className="space-y-4">
            <Label>Data Categories Affected</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {COMMON_DATA_CATEGORIES.slice(0, 12).map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={form.watch('data_categories_affected').includes(category)}
                    onCheckedChange={() => toggleDataCategory(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Records Affected */}
          <div className="space-y-2">
            <Label htmlFor="estimated_records_affected">Estimated Records Affected</Label>
            <Input
              id="estimated_records_affected"
              type="number"
              placeholder="e.g., 1000"
              {...form.register('estimated_records_affected', { valueAsNumber: true })}
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">72-Hour Notification Deadline</p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Under GDPR Article 33, breaches must be reported to the supervisory authority within 72 hours
              of becoming aware, unless unlikely to result in a risk to individuals&apos; rights.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Report Breach
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
