'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateVendorFormData } from '@/lib/vendors/schemas';

interface DoraComplianceFieldsProps {
  form: UseFormReturn<UpdateVendorFormData>;
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'SEK', label: 'SEK - Swedish Krona' },
  { value: 'NOK', label: 'NOK - Norwegian Krone' },
  { value: 'DKK', label: 'DKK - Danish Krone' },
];

export function DoraComplianceFields({ form }: DoraComplianceFieldsProps) {
  const monitoringEnabled = form.watch('monitoring_enabled');
  const externalRiskScore = form.watch('external_risk_score');

  return (
    <div className="space-y-6">
      {/* Critical Function Designation */}
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

      {/* Financial Exposure - for HHI concentration risk */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Financial Exposure</CardTitle>
          <CardDescription>
            Annual expenditure data used for concentration risk (HHI) calculation under DORA TPRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="total_annual_expense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Expense</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="e.g., 150000"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Total annual spend with this vendor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expense_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={field.value ?? 'EUR'}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* External Risk Monitoring */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">External Risk Monitoring</CardTitle>
          <CardDescription>
            Third-party risk intelligence from SecurityScorecard, BitSight, or similar providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display current external risk score if available */}
          {externalRiskScore !== null && externalRiskScore !== undefined && (
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Current Risk Score</p>
                <p className="text-xs text-muted-foreground">
                  From external monitoring service
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{externalRiskScore}</span>
                <Badge
                  variant={
                    externalRiskScore >= 80
                      ? 'default'
                      : externalRiskScore >= 60
                        ? 'secondary'
                        : externalRiskScore >= 40
                          ? 'outline'
                          : 'destructive'
                  }
                >
                  {externalRiskScore >= 80
                    ? 'Good'
                    : externalRiskScore >= 60
                      ? 'Moderate'
                      : externalRiskScore >= 40
                        ? 'Low'
                        : 'Critical'}
                </Badge>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="monitoring_enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Enable Continuous Monitoring</FormLabel>
                  <FormDescription>
                    Automatically track this vendor&apos;s security posture
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {monitoringEnabled && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/30">
              <FormField
                control={form.control}
                name="monitoring_domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monitoring Domain</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="e.g., example.com"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Primary domain to monitor for security issues
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monitoring_alert_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="e.g., 70"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Alert when score drops below this threshold (0-100)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
