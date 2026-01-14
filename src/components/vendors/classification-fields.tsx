'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  TIER_INFO,
  PROVIDER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type VendorTier,
  type ProviderType,
  type ServiceType,
} from '@/lib/vendors/types';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateVendorFormData } from '@/lib/vendors/schemas';

interface ClassificationFieldsProps {
  form: UseFormReturn<UpdateVendorFormData>;
}

export function ClassificationFields({ form }: ClassificationFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="tier"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vendor Tier *</FormLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(TIER_INFO) as VendorTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition-colors',
                    field.value === tier
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  )}
                  onClick={() => field.onChange(tier)}
                >
                  <p className="font-medium">{TIER_INFO[tier].label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {TIER_INFO[tier].description}
                  </p>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="provider_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Provider Type</FormLabel>
            <Select
              value={field.value || ''}
              onValueChange={(value) => field.onChange(value || null)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Object.keys(PROVIDER_TYPE_LABELS) as ProviderType[]).map(
                  (type) => (
                    <SelectItem key={type} value={type}>
                      {PROVIDER_TYPE_LABELS[type]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_types"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Types</FormLabel>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map(
                (type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={`service-${type}`}
                      checked={field.value?.includes(type)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        if (checked) {
                          field.onChange([...current, type]);
                        } else {
                          field.onChange(
                            current.filter((t) => t !== type)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`service-${type}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {SERVICE_TYPE_LABELS[type]}
                    </Label>
                  </div>
                )
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
