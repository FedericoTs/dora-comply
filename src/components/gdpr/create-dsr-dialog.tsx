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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createDSR } from '@/lib/gdpr/actions';
import { DSR_TYPE_LABELS, type DSRType } from '@/lib/gdpr/types';

const formSchema = z.object({
  request_type: z.enum([
    'access',
    'rectification',
    'erasure',
    'restriction',
    'portability',
    'objection',
    'automated_decision',
  ] as const),
  data_subject_name: z.string().optional(),
  data_subject_email: z.string().email().optional().or(z.literal('')),
  data_subject_phone: z.string().optional(),
  request_details: z.string().optional(),
  received_via: z.string().optional(),
  received_at: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateDSRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDSRDialog({ open, onOpenChange, onSuccess }: CreateDSRDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      request_type: 'access',
      data_subject_name: '',
      data_subject_email: '',
      data_subject_phone: '',
      request_details: '',
      received_via: 'email',
      received_at: new Date().toISOString().split('T')[0],
    },
  });

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createDSR({
        request_type: data.request_type,
        data_subject_name: data.data_subject_name || undefined,
        data_subject_email: data.data_subject_email || undefined,
        data_subject_phone: data.data_subject_phone || undefined,
        request_details: data.request_details || undefined,
        received_via: data.received_via || undefined,
        received_at: data.received_at || undefined,
      });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to create DSR:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Data Subject Request</DialogTitle>
          <DialogDescription>
            Record a new data subject rights request. The deadline will be calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Request Type */}
          <div className="space-y-2">
            <Label>Request Type *</Label>
            <Select
              value={form.watch('request_type')}
              onValueChange={(value) => form.setValue('request_type', value as DSRType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DSR_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Subject Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Data Subject Information</h3>

            <div className="space-y-2">
              <Label htmlFor="data_subject_name">Name</Label>
              <Input
                id="data_subject_name"
                placeholder="e.g., John Smith"
                {...form.register('data_subject_name')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_subject_email">Email</Label>
                <Input
                  id="data_subject_email"
                  type="email"
                  placeholder="email@example.com"
                  {...form.register('data_subject_email')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_subject_phone">Phone</Label>
                <Input
                  id="data_subject_phone"
                  placeholder="+1 234 567 890"
                  {...form.register('data_subject_phone')}
                />
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-2">
            <Label htmlFor="request_details">Request Details</Label>
            <Textarea
              id="request_details"
              placeholder="Describe the request..."
              rows={3}
              {...form.register('request_details')}
            />
          </div>

          {/* Receipt Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="received_via">Received Via</Label>
              <Select
                value={form.watch('received_via')}
                onValueChange={(value) => form.setValue('received_via', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="web_form">Web Form</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="received_at">Received Date</Label>
              <Input
                id="received_at"
                type="date"
                {...form.register('received_at')}
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> The response deadline will be set to 30 days from the received date.
              Extensions up to 60 additional days may be applied for complex requests.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
