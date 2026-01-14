'use client';

import {
  Scale,
  Shield,
  TrendingUp,
  Users,
  Info,
} from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ENTITY_TYPE_INFO } from '@/lib/compliance/entity-classification';
import type { EntityType } from '@/lib/auth/types';
import type { OrganizationFormData, SignificanceLevel } from '@/lib/settings/organization-constants';

interface EntityClassificationSectionProps {
  form: UseFormReturn<OrganizationFormData>;
  significanceLevel: SignificanceLevel;
  entityType: EntityType;
}

export function EntityClassificationSection({
  form,
  significanceLevel,
  entityType,
}: EntityClassificationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Entity Classification
        </CardTitle>
        <CardDescription>
          DORA applies proportionally based on entity significance. This determines your testing and reporting requirements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Significance Level Selection */}
        <FormField
          control={form.control}
          name="significanceLevel"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Significance Assessment</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="space-y-3"
                >
                  {/* Significant Entity */}
                  <SignificanceLevelOption
                    value="significant"
                    currentValue={field.value}
                    onChange={field.onChange}
                    icon={Shield}
                    iconColor="text-primary"
                    label="Significant Entity"
                    description="Subject to enhanced oversight including mandatory TLPT (Art. 26-27) every 3 years. Typically includes systemically important institutions."
                    warning={
                      !ENTITY_TYPE_INFO[entityType]?.canBeSignificant
                        ? `Note: ${ENTITY_TYPE_INFO[entityType]?.label} entities are not typically designated as significant.`
                        : undefined
                    }
                  />

                  {/* Non-Significant Entity */}
                  <SignificanceLevelOption
                    value="non_significant"
                    currentValue={field.value}
                    onChange={field.onChange}
                    icon={TrendingUp}
                    iconColor="text-info"
                    label="Non-Significant Entity"
                    description="Standard DORA requirements apply. Not subject to mandatory TLPT but may conduct voluntary penetration testing."
                  />

                  {/* Simplified Framework */}
                  <SignificanceLevelOption
                    value="simplified"
                    currentValue={field.value}
                    onChange={field.onChange}
                    icon={Users}
                    iconColor="text-success"
                    label="Simplified Framework (Art. 16)"
                    description="For small or exempted institutions only. Proportionate ICT risk management requirements apply."
                    disabled={!ENTITY_TYPE_INFO[entityType]?.canUseSimplified}
                    error={
                      !ENTITY_TYPE_INFO[entityType]?.canUseSimplified
                        ? `${ENTITY_TYPE_INFO[entityType]?.label} entities are not eligible for the simplified framework.`
                        : undefined
                    }
                  />
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Significance Rationale - Only show when significant is selected */}
        {significanceLevel === 'significant' && (
          <FormField
            control={form.control}
            name="significanceRationale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Significance Rationale</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Document the basis for the significant entity designation (e.g., regulatory notification, asset thresholds, systemic importance criteria)..."
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormDescription>
                  Required for audit trail. Document why this entity is designated as significant under DORA.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Separator />

        {/* Size Metrics (Optional) */}
        <SizeMetricsFields form={form} entityType={entityType} />

        {/* Classification Summary */}
        <ClassificationSummary significanceLevel={significanceLevel} />
      </CardContent>
    </Card>
  );
}

// Significance Level Option Component
interface SignificanceLevelOptionProps {
  value: string;
  currentValue: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
  iconColor: string;
  label: string;
  description: string;
  disabled?: boolean;
  warning?: string;
  error?: string;
}

function SignificanceLevelOption({
  value,
  currentValue,
  onChange,
  icon: Icon,
  iconColor,
  label,
  description,
  disabled,
  warning,
  error,
}: SignificanceLevelOptionProps) {
  return (
    <div
      className={cn(
        'flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors',
        currentValue === value
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50',
        disabled && 'opacity-50'
      )}
      onClick={() => {
        if (!disabled) {
          onChange(value);
        }
      }}
    >
      <RadioGroupItem value={value} id={value} className="mt-1" disabled={disabled} />
      <div className="flex-1 space-y-1">
        <Label
          htmlFor={value}
          className={cn(
            'font-medium cursor-pointer flex items-center gap-2',
            disabled && 'cursor-not-allowed'
          )}
        >
          <Icon className={cn('h-4 w-4', iconColor)} />
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
        {warning && (
          <p className="text-xs text-warning mt-2">{warning}</p>
        )}
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}

// Size Metrics Fields Component
interface SizeMetricsFieldsProps {
  form: UseFormReturn<OrganizationFormData>;
  entityType: EntityType;
}

function SizeMetricsFields({ form, entityType }: SizeMetricsFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-1">Size Metrics (Optional)</h4>
        <p className="text-xs text-muted-foreground">
          These metrics help assess eligibility thresholds. They are optional but useful for regulatory documentation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="employeeCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Employee Count
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="e.g., 500"
                  min={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="totalAssetsEur"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Total Assets (EUR)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="e.g., 500000000"
                  min={0}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {entityType === 'insurance_undertaking' && (
          <FormField
            control={form.control}
            name="annualGrossPremiumEur"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Annual Gross Premium (EUR)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="e.g., 100000000"
                    min={0}
                  />
                </FormControl>
                <FormDescription>
                  For insurance undertakings - used for significance threshold calculation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}

// Classification Summary Component
interface ClassificationSummaryProps {
  significanceLevel: SignificanceLevel;
}

function ClassificationSummary({ significanceLevel }: ClassificationSummaryProps) {
  return (
    <Alert className="border-info/50 bg-info/5">
      <Info className="h-4 w-4 text-info" />
      <AlertTitle className="text-info">Classification Summary</AlertTitle>
      <AlertDescription className="text-sm">
        {significanceLevel === 'significant' && (
          <div className="space-y-2 mt-2">
            <p>As a <strong>significant entity</strong>, your organization is subject to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Full ICT Risk Management Framework (Art. 5-15)</li>
              <li>Incident Reporting within DORA deadlines (Art. 17-23)</li>
              <li>Mandatory TLPT every 3 years (Art. 26-27)</li>
              <li>Third-party risk management (Art. 28-30)</li>
            </ul>
          </div>
        )}
        {significanceLevel === 'non_significant' && (
          <div className="space-y-2 mt-2">
            <p>As a <strong>non-significant entity</strong>, your organization is subject to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Full ICT Risk Management Framework (Art. 5-15)</li>
              <li>Incident Reporting within DORA deadlines (Art. 17-23)</li>
              <li>Digital Operational Resilience Testing (Art. 24-25)</li>
              <li>Third-party risk management (Art. 28-30)</li>
            </ul>
            <p className="text-xs mt-2">Note: TLPT is not mandatory but voluntary testing is recommended.</p>
          </div>
        )}
        {significanceLevel === 'simplified' && (
          <div className="space-y-2 mt-2">
            <p>Under the <strong>simplified framework</strong> (Art. 16), your organization has:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Simplified ICT Risk Management (Art. 16)</li>
              <li>Incident Reporting within DORA deadlines (Art. 17-23)</li>
              <li>Basic Resilience Testing (Art. 24-25)</li>
              <li>Third-party risk management (Art. 28-30)</li>
            </ul>
            <p className="text-xs mt-2">Proportionate requirements apply based on your size and risk profile.</p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
