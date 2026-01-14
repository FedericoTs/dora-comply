'use client';

import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateVendorFormData } from '@/lib/vendors/schemas';

interface ContactFieldsProps {
  form: UseFormReturn<UpdateVendorFormData>;
}

export function ContactFields({ form }: ContactFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
        name="primary_contact.phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Contact Phone</FormLabel>
            <FormControl>
              <Input placeholder="+1 555 123 4567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="primary_contact.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Contact Title</FormLabel>
            <FormControl>
              <Input placeholder="Account Manager" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
