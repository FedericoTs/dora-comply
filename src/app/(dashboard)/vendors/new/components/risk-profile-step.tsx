'use client';

/**
 * Risk Profile Step
 *
 * Combined step for vendor classification and DORA details.
 * Merges the previous Classification and DORA Details steps.
 */

import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';
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

interface RiskProfileStepProps {
  form: UseFormReturn<CreateVendorFormInput>;
}

export function RiskProfileStep({ form }: RiskProfileStepProps) {
  return (
    <div className="space-y-6">
      {/* Classification Section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Classification</h3>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="provider_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    Provider Type
                    <HelpTooltip content={DORA_HELP.providerType} />
                  </FormLabel>
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
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
                  <FormLabel>Headquarters Country</FormLabel>
                  <FormControl>
                    <CountrySelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select country..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="service_types"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Types</FormLabel>
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
      </div>

      <Separator />

      {/* DORA Details Section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">DORA Compliance</h3>

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
      </div>

      <Separator />

      {/* Contact & Notes Section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Contact (Optional)</h3>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primary_contact.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
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
                  <FormLabel>Contact Email</FormLabel>
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
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Additional notes about this vendor..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
