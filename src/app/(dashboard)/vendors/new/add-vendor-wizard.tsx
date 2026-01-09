'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Check,
  ChevronRight,
  Loader2,
  Building2,
  Shield,
  Users,
  Search,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { HelpTooltip, DORA_HELP } from '@/components/ui/help-tooltip';
import { cn } from '@/lib/utils';
import { createVendorSchema, type CreateVendorFormData, type CreateVendorFormInput } from '@/lib/vendors/schemas';
import {
  TIER_INFO,
  PROVIDER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type VendorTier,
  type ProviderType,
  type ServiceType,
} from '@/lib/vendors/types';
import { createVendor } from '@/lib/vendors/actions';
import { validateLEI, searchEntities, getCountryFlag } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name and LEI lookup', icon: Building2, time: '1 min', requiredFields: 1, optionalFields: 1 },
  { id: 2, title: 'Classification', description: 'Tier and provider type', icon: Shield, time: '1 min', requiredFields: 1, optionalFields: 3 },
  { id: 3, title: 'DORA Details', description: 'Critical functions', icon: Users, time: '1 min', requiredFields: 0, optionalFields: 4 },
];

// Calculate total estimated time
const TOTAL_TIME = '~3 min';

export function AddVendorWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingLei, setIsSearchingLei] = useState(false);
  const [leiSuggestions, setLeiSuggestions] = useState<GLEIFEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<GLEIFEntity | null>(null);

  const form = useForm<CreateVendorFormInput, unknown, CreateVendorFormData>({
    resolver: zodResolver(createVendorSchema),
    mode: 'onTouched', // Validate on blur, then on change
    defaultValues: {
      name: '',
      lei: '',
      tier: 'standard',
      provider_type: undefined,
      headquarters_country: '',
      service_types: [],
      supports_critical_function: false,
      critical_functions: [],
      is_intra_group: false,
      notes: '',
    },
  });

  // LEI Lookup
  const handleLeiLookup = async () => {
    const lei = form.getValues('lei');
    if (!lei || lei.length !== 20) {
      toast.error('Please enter a valid 20-character LEI');
      return;
    }

    setIsSearchingLei(true);
    const result = await validateLEI(lei);
    setIsSearchingLei(false);

    if (result.valid && result.entity) {
      setSelectedEntity(result.entity);
      form.setValue('name', result.entity.legalName);
      form.setValue('headquarters_country', result.entity.legalAddress.country);
      toast.success('Entity found and details auto-filled');
    } else {
      toast.error(result.error || 'LEI not found');
    }
  };

  // Name search for LEI suggestions
  const handleNameSearch = async () => {
    const name = form.getValues('name');
    if (!name || name.length < 3) return;

    setIsSearchingLei(true);
    const result = await searchEntities(name, 5);
    setIsSearchingLei(false);

    if (result.results.length > 0) {
      setLeiSuggestions(result.results);
    } else {
      setLeiSuggestions([]);
    }
  };

  // Select entity from suggestions
  const handleSelectEntity = (entity: GLEIFEntity) => {
    setSelectedEntity(entity);
    form.setValue('name', entity.legalName);
    form.setValue('lei', entity.lei);
    form.setValue('headquarters_country', entity.legalAddress.country);
    setLeiSuggestions([]);
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission
  const onSubmit = async (data: CreateVendorFormData) => {
    setIsSubmitting(true);
    const result = await createVendor(data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      toast.success(`${result.data.name} has been added`);
      router.push(`/vendors/${result.data.id}`);
    } else {
      toast.error(result.error?.message || 'Failed to create vendor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar with Time Estimate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Step {currentStep} of {STEPS.length}</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {TOTAL_TIME} total
            </span>
          </div>
          <span className="font-medium text-primary">{Math.round((currentStep / STEPS.length) * 100)}% complete</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-3',
                currentStep === step.id && 'text-foreground',
                currentStep !== step.id && 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  currentStep > step.id && 'border-primary bg-primary text-primary-foreground',
                  currentStep === step.id && 'border-primary bg-background',
                  currentStep < step.id && 'border-muted bg-muted'
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
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
                              onClick={handleNameSearch}
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

                    {/* LEI Suggestions */}
                    {leiSuggestions.length > 0 && (
                      <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                        <p className="text-sm font-medium">Matching entities:</p>
                        {leiSuggestions.map((entity) => (
                          <button
                            key={entity.lei}
                            type="button"
                            className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                            onClick={() => handleSelectEntity(entity)}
                          >
                            <p className="font-medium text-sm">{entity.legalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {getCountryFlag(entity.legalAddress.country)}{' '}
                              {entity.legalAddress.country} • LEI: {entity.lei}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

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
                              onClick={handleLeiLookup}
                              disabled={isSearchingLei || field.value?.length !== 20}
                            >
                              {isSearchingLei ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Verify'
                              )}
                            </Button>
                          </div>
                          <FormDescription>
                            Enter the LEI to auto-fill vendor details from GLEIF
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Selected Entity Info */}
                    {selectedEntity && (
                      <div className="rounded-lg border border-success/50 bg-success/10 p-4">
                        <div className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-success mt-0.5" />
                          <div>
                            <p className="font-medium text-success">Entity verified</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedEntity.legalName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getCountryFlag(selectedEntity.legalAddress.country)}{' '}
                              {selectedEntity.legalAddress.city},{' '}
                              {selectedEntity.legalAddress.country}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Classification */}
              {currentStep === 2 && (
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
              )}

              {/* Step 3: DORA Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Additional notes about this vendor..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                Create Vendor
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
