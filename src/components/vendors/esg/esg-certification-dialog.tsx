'use client';

/**
 * ESG Certification Dialog Component
 *
 * Form for adding ESG certifications to a vendor
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
import { Loader2, Award } from 'lucide-react';
import { toast } from 'sonner';
import { CERTIFICATION_LABELS, type CertificationType } from '@/lib/esg/types';

interface ESGCertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  onSuccess?: () => void;
}

const certificationSchema = z.object({
  certification_name: z.string().min(1, 'Certification name is required'),
  certification_type: z.string().min(1, 'Certification type is required'),
  issuing_body: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  certificate_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

export function ESGCertificationDialog({
  open,
  onOpenChange,
  vendorId,
  onSuccess,
}: ESGCertificationDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      certification_name: '',
      certification_type: '',
      issuing_body: '',
      issue_date: '',
      expiry_date: '',
      certificate_url: '',
      notes: '',
    },
  });

  const selectedType = form.watch('certification_type');

  // Auto-fill certification name based on type
  const handleTypeChange = (type: string) => {
    form.setValue('certification_type', type);
    if (type !== 'other') {
      form.setValue('certification_name', CERTIFICATION_LABELS[type as CertificationType] || type);
    }
  };

  const onSubmit = async (data: CertificationFormData) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/vendors/${vendorId}/esg/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          issue_date: data.issue_date || null,
          expiry_date: data.expiry_date || null,
          certificate_url: data.certificate_url || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to add certification');

      toast.success('ESG certification has been added successfully.');

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to add certification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Add ESG Certification
          </DialogTitle>
          <DialogDescription>
            Record an ESG-related certification held by this vendor
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="certification_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Type</FormLabel>
                  <Select value={field.value} onValueChange={handleTypeChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select certification type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CERTIFICATION_LABELS).map(([value, label]) => (
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
              name="certification_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., ISO 14001:2015"
                      {...field}
                      disabled={selectedType !== 'other' && selectedType !== ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issuing_body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuing Body (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BSI, DNV, SGS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certificate_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the certificate or verification page
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
                      placeholder="Any additional notes about this certification..."
                      className="min-h-[80px]"
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
                Add Certification
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
