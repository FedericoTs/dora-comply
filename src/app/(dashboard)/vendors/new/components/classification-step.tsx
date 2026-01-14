'use client';

import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { HelpTooltip, DORA_HELP } from '@/components/ui/help-tooltip';
import { cn } from '@/lib/utils';
import type { CreateVendorFormInput } from '@/lib/vendors/schemas';
import {
  TIER_INFO,
  PROVIDER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type VendorTier,
  type ProviderType,
  type ServiceType,
} from '@/lib/vendors/types';

interface ClassificationStepProps {
  form: UseFormReturn<CreateVendorFormInput>;
}

export function ClassificationStep({ form }: ClassificationStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="tier"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Vendor Tier *
              <HelpTooltip content={DORA_HELP.tier} />
            </FormLabel>
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
            <FormLabel className="flex items-center gap-1.5">
              Provider Type
              <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              <HelpTooltip content={DORA_HELP.providerType} />
            </FormLabel>
            <Select
              value={field.value || ''}
              onValueChange={field.onChange}
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
        name="headquarters_country"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Headquarters Country
              <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </FormLabel>
            <FormControl>
              <CountrySelect
                value={field.value}
                onChange={field.onChange}
                placeholder="Select headquarters country..."
              />
            </FormControl>
            <FormDescription>
              Auto-filled from LEI if available
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_types"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Service Types
              <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </FormLabel>
            <div className="grid gap-2 sm:grid-cols-2">
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
