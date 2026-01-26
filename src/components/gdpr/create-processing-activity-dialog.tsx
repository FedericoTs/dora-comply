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
import { Loader2 } from 'lucide-react';
import { createProcessingActivity } from '@/lib/gdpr/actions';
import {
  LAWFUL_BASIS_LABELS,
  COMMON_DATA_CATEGORIES,
  COMMON_DATA_SUBJECT_CATEGORIES,
  type LawfulBasis,
} from '@/lib/gdpr/types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  purposes: z.array(z.string()).min(1, 'At least one purpose is required'),
  lawful_basis: z.enum([
    'consent',
    'contract',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests',
  ] as const),
  lawful_basis_details: z.string().optional(),
  data_subject_categories: z.array(z.string()).min(1, 'At least one data subject category is required'),
  personal_data_categories: z.array(z.string()).min(1, 'At least one data category is required'),
  involves_special_category: z.boolean(),
  involves_international_transfer: z.boolean(),
  requires_dpia: z.boolean(),
  retention_period: z.string().optional(),
  department: z.string().optional(),
  data_owner: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateProcessingActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProcessingActivityDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProcessingActivityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [purposeInput, setPurposeInput] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      purposes: [],
      lawful_basis: 'legitimate_interests',
      lawful_basis_details: '',
      data_subject_categories: [],
      personal_data_categories: [],
      involves_special_category: false,
      involves_international_transfer: false,
      requires_dpia: false,
      retention_period: '',
      department: '',
      data_owner: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createProcessingActivity({
        name: data.name,
        description: data.description,
        purposes: data.purposes,
        lawful_basis: data.lawful_basis,
        lawful_basis_details: data.lawful_basis_details,
        data_subject_categories: data.data_subject_categories,
        personal_data_categories: data.personal_data_categories,
        involves_special_category: data.involves_special_category,
        involves_international_transfer: data.involves_international_transfer,
        requires_dpia: data.requires_dpia,
        retention_period: data.retention_period,
        department: data.department,
        data_owner: data.data_owner,
      });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to create processing activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPurpose = () => {
    if (purposeInput.trim()) {
      const current = form.getValues('purposes');
      form.setValue('purposes', [...current, purposeInput.trim()]);
      setPurposeInput('');
    }
  };

  const removePurpose = (index: number) => {
    const current = form.getValues('purposes');
    form.setValue('purposes', current.filter((_, i) => i !== index));
  };

  const toggleDataSubject = (category: string) => {
    const current = form.getValues('data_subject_categories');
    if (current.includes(category)) {
      form.setValue('data_subject_categories', current.filter((c) => c !== category));
    } else {
      form.setValue('data_subject_categories', [...current, category]);
    }
  };

  const toggleDataCategory = (category: string) => {
    const current = form.getValues('personal_data_categories');
    if (current.includes(category)) {
      form.setValue('personal_data_categories', current.filter((c) => c !== category));
    } else {
      form.setValue('personal_data_categories', [...current, category]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Processing Activity</DialogTitle>
          <DialogDescription>
            Document a new processing activity for your RoPA (Article 30)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Contact Management"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the processing activity..."
                rows={2}
                {...form.register('description')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Marketing"
                  {...form.register('department')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_owner">Data Owner</Label>
                <Input
                  id="data_owner"
                  placeholder="e.g., John Smith"
                  {...form.register('data_owner')}
                />
              </div>
            </div>
          </div>

          {/* Purposes */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Processing Purposes *</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Add a purpose..."
                value={purposeInput}
                onChange={(e) => setPurposeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPurpose())}
              />
              <Button type="button" variant="outline" onClick={addPurpose}>
                Add
              </Button>
            </div>
            {form.watch('purposes').length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.watch('purposes').map((purpose, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded-md"
                  >
                    {purpose}
                    <button
                      type="button"
                      onClick={() => removePurpose(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {form.formState.errors.purposes && (
              <p className="text-xs text-destructive">{form.formState.errors.purposes.message}</p>
            )}
          </div>

          {/* Lawful Basis */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Lawful Basis *</h3>
            <Select
              value={form.watch('lawful_basis')}
              onValueChange={(value) => form.setValue('lawful_basis', value as LawfulBasis)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lawful basis" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LAWFUL_BASIS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label htmlFor="lawful_basis_details">Justification Details</Label>
              <Textarea
                id="lawful_basis_details"
                placeholder="Explain why this lawful basis applies..."
                rows={2}
                {...form.register('lawful_basis_details')}
              />
            </div>
          </div>

          {/* Data Subjects */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Data Subject Categories *</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_DATA_SUBJECT_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={form.watch('data_subject_categories').includes(category)}
                    onCheckedChange={() => toggleDataSubject(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
            {form.formState.errors.data_subject_categories && (
              <p className="text-xs text-destructive">
                {form.formState.errors.data_subject_categories.message}
              </p>
            )}
          </div>

          {/* Data Categories */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Personal Data Categories *</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {COMMON_DATA_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={form.watch('personal_data_categories').includes(category)}
                    onCheckedChange={() => toggleDataCategory(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
            {form.formState.errors.personal_data_categories && (
              <p className="text-xs text-destructive">
                {form.formState.errors.personal_data_categories.message}
              </p>
            )}
          </div>

          {/* Retention */}
          <div className="space-y-2">
            <Label htmlFor="retention_period">Retention Period</Label>
            <Input
              id="retention_period"
              placeholder="e.g., 7 years after contract termination"
              {...form.register('retention_period')}
            />
          </div>

          {/* Flags */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Additional Considerations</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={form.watch('involves_special_category')}
                  onCheckedChange={(checked) =>
                    form.setValue('involves_special_category', !!checked)
                  }
                />
                <div>
                  <p className="text-sm font-medium">Involves Special Category Data</p>
                  <p className="text-xs text-muted-foreground">
                    Health, biometric, genetic, political opinions, religious beliefs, etc.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={form.watch('involves_international_transfer')}
                  onCheckedChange={(checked) =>
                    form.setValue('involves_international_transfer', !!checked)
                  }
                />
                <div>
                  <p className="text-sm font-medium">Involves International Data Transfer</p>
                  <p className="text-xs text-muted-foreground">
                    Data is transferred outside the EEA
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={form.watch('requires_dpia')}
                  onCheckedChange={(checked) => form.setValue('requires_dpia', !!checked)}
                />
                <div>
                  <p className="text-sm font-medium">Requires DPIA</p>
                  <p className="text-xs text-muted-foreground">
                    High risk processing requiring Data Protection Impact Assessment
                  </p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
