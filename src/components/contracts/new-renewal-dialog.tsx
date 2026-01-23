'use client';

/**
 * New Renewal Dialog
 * Dialog for creating a new contract renewal
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { createRenewal } from '@/lib/contracts/actions';
import { useRouter } from 'next/navigation';

const renewalSchema = z.object({
  renewalType: z.enum(['extension', 'renewal', 'amendment', 'termination']),
  newExpiryDate: z.string().optional(),
  valueChange: z.number().optional(),
  valueChangePercent: z.number().optional(),
  termsChanged: z.boolean(),
  termsChangeSummary: z.string().optional(),
  dueDate: z.string().optional(),
});

type RenewalFormValues = z.infer<typeof renewalSchema>;

interface NewRenewalDialogProps {
  contractId: string;
  currentExpiryDate: string | null;
  trigger?: React.ReactNode;
}

export function NewRenewalDialog({
  contractId,
  currentExpiryDate,
  trigger,
}: NewRenewalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<RenewalFormValues>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      renewalType: 'renewal',
      termsChanged: false,
    },
  });

  const onSubmit = async (values: RenewalFormValues) => {
    setIsLoading(true);
    try {
      const result = await createRenewal({
        contractId,
        renewalType: values.renewalType,
        previousExpiryDate: currentExpiryDate || new Date().toISOString(),
        newExpiryDate: values.newExpiryDate,
        valueChange: values.valueChange,
        valueChangePercent: values.valueChangePercent,
        termsChanged: values.termsChanged,
        termsChangeSummary: values.termsChangeSummary,
        dueDate: values.dueDate,
      });

      if (result.success) {
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        console.error('Failed to create renewal:', result.error);
      }
    } catch (error) {
      console.error('Error creating renewal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Renewal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Renewal Process</DialogTitle>
          <DialogDescription>
            Create a new renewal record to track the contract renewal process.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="renewalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renewal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="renewal">Renewal</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="amendment">Amendment</SelectItem>
                      <SelectItem value="termination">Termination</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave empty if not yet determined
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valueChange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value Change (EUR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueChangePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    When should a decision be made?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsChanged"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Terms Changed</FormLabel>
                    <FormDescription>
                      Are there changes to the contract terms?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('termsChanged') && (
              <FormField
                control={form.control}
                name="termsChangeSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms Change Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the changes to terms..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Renewal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
