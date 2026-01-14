'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateVendorFormData } from '@/lib/vendors/schemas';

interface NotesFieldProps {
  form: UseFormReturn<UpdateVendorFormData>;
}

export function NotesField({ form }: NotesFieldProps) {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <textarea
              className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes about this vendor..."
              {...field}
              value={field.value || ''}
            />
          </FormControl>
          <FormDescription>
            Internal notes about this vendor (not visible to the vendor)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
