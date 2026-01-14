'use client';

import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CreateVendorFormInput } from '@/lib/vendors/schemas';

interface DoraDetailsStepProps {
  form: UseFormReturn<CreateVendorFormInput>;
}

export function DoraDetailsStep({ form }: DoraDetailsStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="supports_critical_function"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                Supports Critical or Important Function
              </FormLabel>
              <FormDescription>
                This vendor provides services that support a critical or
                important function as defined under DORA Article 3
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_intra_group"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                Intra-group Provider
              </FormLabel>
              <FormDescription>
                This vendor is part of your organization&apos;s corporate
                group structure
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="primary_contact.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Contact Name</FormLabel>
            <FormControl>
              <Input placeholder="Contact name..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="primary_contact.email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Contact Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="contact@vendor.com"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <textarea
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional notes about this vendor..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
