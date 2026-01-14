'use client';

import { Loader2, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { CountrySelect } from '@/components/ui/country-select';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateVendorFormData } from '@/lib/vendors/schemas';
import type { GLEIFEntity } from '@/lib/vendors/types';

interface BasicInfoFieldsProps {
  form: UseFormReturn<UpdateVendorFormData>;
  isVerifyingLei: boolean;
  leiVerified: GLEIFEntity | null;
  onVerifyLei: () => void;
  onLeiChange: () => void;
}

export function BasicInfoFields({
  form,
  isVerifyingLei,
  leiVerified,
  onVerifyLei,
  onLeiChange,
}: BasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vendor Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter vendor name..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="lei"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LEI (Legal Entity Identifier)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="20-character LEI code"
                    maxLength={20}
                    className="font-mono uppercase"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value.toUpperCase());
                      onLeiChange();
                    }}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onVerifyLei}
                  disabled={isVerifyingLei || field.value?.length !== 20}
                >
                  {isVerifyingLei ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {leiVerified && (
                <div className="flex items-center gap-2 text-sm text-success mt-1">
                  <Check className="h-4 w-4" />
                  Verified: {leiVerified.legalName}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="headquarters_country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headquarters Country</FormLabel>
              <FormControl>
                <CountrySelect
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Select headquarters country..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="jurisdiction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jurisdiction</FormLabel>
            <FormControl>
              <CountrySelect
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Select legal jurisdiction..."
              />
            </FormControl>
            <FormDescription>
              Country of legal jurisdiction for this vendor
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
