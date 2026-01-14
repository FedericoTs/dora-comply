'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateVendorFormData } from '@/lib/vendors/schemas';

interface DoraComplianceFieldsProps {
  form: UseFormReturn<UpdateVendorFormData>;
}

export function DoraComplianceFields({ form }: DoraComplianceFieldsProps) {
  return (
    <div className="space-y-4">
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
    </div>
  );
}
