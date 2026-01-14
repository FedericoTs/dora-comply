'use client';

import { Search, Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { HelpTooltip, DORA_HELP } from '@/components/ui/help-tooltip';
import type { CreateVendorFormInput } from '@/lib/vendors/schemas';
import type { GLEIFEntity } from '@/lib/vendors/types';
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
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor Name *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="Enter vendor name..."
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onNameSearch}
                  disabled={isSearchingLei || field.value.length < 3}
                >
                  {isSearchingLei ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <FormDescription>
                Search for the vendor to auto-fill LEI details
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <LeiSuggestions
          suggestions={leiSuggestions}
          onSelect={onSelectEntity}
        />

        <FormField
          control={form.control}
          name="lei"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                LEI
                <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
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
                Know the LEI? Enter it to auto-fill details. Don&apos;t have it? No problem — just continue.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedEntity && (
          <VerifiedEntityCard entity={selectedEntity} />
        )}
      </div>
    </div>
  );
}
