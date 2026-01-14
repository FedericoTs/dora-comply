'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  CTPP_DESIGNATION_SOURCE_LABELS,
  CTPP_AUTHORITY_LABELS,
  OVERSIGHT_PLAN_STATUS_INFO,
  CTPP_SUBSTITUTABILITY_INFO,
  type CTTPDesignationSource,
  type CTTPDesignatingAuthority,
  type OversightPlanStatus,
  type CTTPSubstitutability,
} from '@/lib/vendors/types';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateVendorFormData } from '@/lib/vendors/schemas';

interface CtppOversightFieldsProps {
  form: UseFormReturn<UpdateVendorFormData>;
  isCTPP: boolean;
}

export function CtppOversightFields({ form, isCTPP }: CtppOversightFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Is CTPP Toggle */}
      <FormField
        control={form.control}
        name="is_ctpp"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border p-4 bg-error/5 border-error/20">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer font-semibold">
                Critical Third-Party Provider (CTPP)
              </FormLabel>
              <FormDescription>
                This vendor is designated as a CTPP under DORA Articles 33-44,
                subject to direct oversight by European Supervisory Authorities
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      {/* CTPP Details - only show when is_ctpp is true */}
      {isCTPP && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="ctpp_designation_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation Source</FormLabel>
                  <Select
                    value={field.value || ''}
                    onValueChange={(value) => field.onChange(value || null)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(CTPP_DESIGNATION_SOURCE_LABELS) as CTTPDesignationSource[]).map(
                        (source) => (
                          <SelectItem key={source} value={source}>
                            {CTPP_DESIGNATION_SOURCE_LABELS[source]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How this CTPP designation was identified
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ctpp_designating_authority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designating Authority</FormLabel>
                  <Select
                    value={field.value || ''}
                    onValueChange={(value) => field.onChange(value || null)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ESA..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(CTPP_AUTHORITY_LABELS) as CTTPDesignatingAuthority[]).map(
                        (auth) => (
                          <SelectItem key={auth} value={auth}>
                            {CTPP_AUTHORITY_LABELS[auth]}
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
              name="lead_overseer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Overseer</FormLabel>
                  <Select
                    value={field.value || ''}
                    onValueChange={(value) => field.onChange(value || null)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ESA..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(CTPP_AUTHORITY_LABELS) as CTTPDesignatingAuthority[]).map(
                        (auth) => (
                          <SelectItem key={auth} value={auth}>
                            {auth}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    ESA responsible for oversight (DORA Art. 34)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="oversight_plan_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oversight Plan Status</FormLabel>
                  <Select
                    value={field.value || 'not_applicable'}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(OVERSIGHT_PLAN_STATUS_INFO) as OversightPlanStatus[]).map(
                        (status) => (
                          <SelectItem key={status} value={status}>
                            {OVERSIGHT_PLAN_STATUS_INFO[status].label}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="ctpp_substitutability_assessment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Substitutability Assessment</FormLabel>
                  <Select
                    value={field.value || ''}
                    onValueChange={(value) => field.onChange(value || null)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assessment..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(CTPP_SUBSTITUTABILITY_INFO) as CTTPSubstitutability[]).map(
                        (sub) => (
                          <SelectItem key={sub} value={sub}>
                            {CTPP_SUBSTITUTABILITY_INFO[sub].label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value && CTPP_SUBSTITUTABILITY_INFO[field.value as CTTPSubstitutability]?.description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ctpp_exit_strategy_documented"
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
                      Exit Strategy Documented
                    </FormLabel>
                    <FormDescription>
                      Exit plan exists per DORA Article 28(8)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="joint_examination_team"
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
                    Joint Examination Team Formed
                  </FormLabel>
                  <FormDescription>
                    A joint examination team has been established per DORA Article 37
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
