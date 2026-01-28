'use client';

/**
 * Step 1: Identity & Contact
 *
 * Collects vendor identification information:
 * - Name (required)
 * - Website (required - for intelligence monitoring)
 * - LEI (optional - auto-fill via GLEIF)
 * - Country (optional)
 * - Industry (optional)
 * - Primary Contact (optional)
 */

import { Search, Loader2, Globe, Building2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { CreateVendorFormInput } from '@/lib/vendors/schemas';
import type { GLEIFEntity, Industry } from '@/lib/vendors/types';
import { INDUSTRY_LABELS } from '@/lib/vendors/types';
import { LeiSuggestions } from './lei-suggestions';
import { VerifiedEntityCard } from './verified-entity-card';

interface BasicInfoStepProps {
  form: UseFormReturn<CreateVendorFormInput>;
  isSearchingLei: boolean;
  leiSuggestions: GLEIFEntity[];
  selectedEntity: GLEIFEntity | null;
  onNameSearch: () => void;
  onLeiLookup: () => void;
  onSelectEntity: (entity: GLEIFEntity) => void;
}

export function BasicInfoStep({
  form,
  isSearchingLei,
  leiSuggestions,
  selectedEntity,
  onNameSearch,
  onLeiLookup,
  onSelectEntity,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Core Identity */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Vendor Identity
        </h3>

        <div className="space-y-4">
          {/* Name with LEI search */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="Enter vendor name..." {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onNameSearch}
                    disabled={isSearchingLei || field.value.length < 3}
                    title="Search GLEIF database"
                  >
                    {isSearchingLei ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormDescription>
                  Search for the vendor to auto-fill LEI and company details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* LEI Suggestions from search */}
          <LeiSuggestions
            suggestions={leiSuggestions}
            onSelect={onSelectEntity}
          />

          {/* Website - Required for monitoring */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  Website *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="example.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Used for breach monitoring and news intelligence
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* LEI */}
          <FormField
            control={form.control}
            name="lei"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  LEI
                  <span className="text-xs font-normal text-muted-foreground">
                    (Optional)
                  </span>
                  <HelpTooltip content={DORA_HELP.lei} />
                </FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="20-character LEI code"
                      maxLength={20}
                      className="font-mono uppercase"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onLeiLookup}
                    disabled={isSearchingLei || field.value?.length !== 20}
                  >
                    {isSearchingLei ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Lookup'
                    )}
                  </Button>
                </div>
                <FormDescription>
                  Know the LEI? Enter it to auto-fill details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Verified Entity Card from GLEIF */}
          {selectedEntity && <VerifiedEntityCard entity={selectedEntity} />}

          {/* Country and Industry side by side */}
          <div className="grid gap-4 sm:grid-cols-2">
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

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    Industry
                  </FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(INDUSTRY_LABELS) as Industry[]).map(
                        (industry) => (
                          <SelectItem key={industry} value={industry}>
                            {INDUSTRY_LABELS[industry]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Primary Contact (Optional)
        </h3>

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
      </div>
    </div>
  );
}
