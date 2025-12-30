'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  X,
  Building2,
  Shield,
  Users,
  FileText,
  Search,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { updateVendorSchema, type UpdateVendorFormData } from '@/lib/vendors/schemas';
import {
  TIER_INFO,
  STATUS_INFO,
  PROVIDER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type Vendor,
  type VendorWithRelations,
  type VendorTier,
  type VendorStatus,
  type ProviderType,
  type ServiceType,
} from '@/lib/vendors/types';
import { updateVendor } from '@/lib/vendors/actions';
import { validateLEI, getCountryFlag } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';

interface EditVendorFormProps {
  vendor: VendorWithRelations;
}

// Collapsible section component
function FormSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  hasChanges = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  hasChanges?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="card-elevated">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                {hasChanges && (
                  <Badge variant="outline" className="text-xs text-warning border-warning">
                    Modified
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function EditVendorForm({ vendor }: EditVendorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingLei, setIsVerifyingLei] = useState(false);
  const [leiVerified, setLeiVerified] = useState<GLEIFEntity | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<VendorStatus | null>(null);

  // Initialize form with vendor data
  const form = useForm<UpdateVendorFormData>({
    resolver: zodResolver(updateVendorSchema),
    defaultValues: {
      name: vendor.name,
      lei: vendor.lei || '',
      tier: vendor.tier,
      status: vendor.status,
      provider_type: vendor.provider_type,
      headquarters_country: vendor.headquarters_country || '',
      jurisdiction: vendor.jurisdiction || '',
      service_types: (vendor.service_types || []) as ServiceType[],
      supports_critical_function: vendor.supports_critical_function,
      critical_functions: vendor.critical_functions || [],
      is_intra_group: vendor.is_intra_group,
      primary_contact: vendor.primary_contact || { name: '' },
      notes: vendor.notes || '',
    },
  });

  const { isDirty, dirtyFields } = form.formState;

  // Track which sections have changes
  const basicInfoChanged = !!(dirtyFields.name || dirtyFields.lei || dirtyFields.headquarters_country || dirtyFields.jurisdiction);
  const classificationChanged = !!(dirtyFields.tier || dirtyFields.provider_type || dirtyFields.service_types);
  const doraChanged = !!(dirtyFields.supports_critical_function || dirtyFields.critical_functions || dirtyFields.is_intra_group);
  const contactChanged = !!dirtyFields.primary_contact;
  const notesChanged = !!dirtyFields.notes;

  // Warn on navigation if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // LEI verification
  const handleVerifyLei = async () => {
    const lei = form.getValues('lei');
    if (!lei || lei.length !== 20) {
      toast.error('Please enter a valid 20-character LEI');
      return;
    }

    setIsVerifyingLei(true);
    const result = await validateLEI(lei);
    setIsVerifyingLei(false);

    if (result.valid && result.entity) {
      setLeiVerified(result.entity);
      toast.success('LEI verified successfully');
    } else {
      setLeiVerified(null);
      toast.error(result.error || 'LEI verification failed');
    }
  };

  // Status change handler
  const handleStatusChange = (status: VendorStatus) => {
    if (status !== vendor.status) {
      setPendingStatus(status);
      setShowStatusDialog(true);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      form.setValue('status', pendingStatus, { shouldDirty: true });
      setShowStatusDialog(false);
      setPendingStatus(null);
    }
  };

  // Cancel with confirmation if dirty
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push(`/vendors/${vendor.id}`);
    }
  };

  const confirmCancel = () => {
    router.push(`/vendors/${vendor.id}`);
  };

  // Form submission
  const onSubmit = async (data: UpdateVendorFormData) => {
    setIsSubmitting(true);

    // Only send changed fields
    const changedData: Partial<UpdateVendorFormData> = {};

    if (dirtyFields.name) changedData.name = data.name;
    if (dirtyFields.lei) changedData.lei = data.lei;
    if (dirtyFields.tier) changedData.tier = data.tier;
    if (dirtyFields.status) changedData.status = data.status;
    if (dirtyFields.provider_type) changedData.provider_type = data.provider_type;
    if (dirtyFields.headquarters_country) changedData.headquarters_country = data.headquarters_country;
    if (dirtyFields.jurisdiction) changedData.jurisdiction = data.jurisdiction;
    if (dirtyFields.service_types) changedData.service_types = data.service_types;
    if (dirtyFields.supports_critical_function) changedData.supports_critical_function = data.supports_critical_function;
    if (dirtyFields.critical_functions) changedData.critical_functions = data.critical_functions;
    if (dirtyFields.is_intra_group) changedData.is_intra_group = data.is_intra_group;
    if (dirtyFields.primary_contact) changedData.primary_contact = data.primary_contact;
    if (dirtyFields.notes) changedData.notes = data.notes;

    const result = await updateVendor(vendor.id, changedData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Vendor updated successfully');
      router.push(`/vendors/${vendor.id}`);
    } else {
      toast.error(result.error?.message || 'Failed to update vendor');
    }
  };

  const currentStatus = form.watch('status');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/vendors/${vendor.id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Vendor
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Vendor</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(vendor.updated_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Quick Change */}
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_INFO) as VendorStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        status === 'active' && 'bg-success',
                        status === 'pending' && 'bg-warning',
                        status === 'inactive' && 'bg-muted-foreground',
                        status === 'offboarding' && 'bg-error'
                      )}
                    />
                    {STATUS_INFO[status].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || !isDirty}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div className="flex-1">
            <p className="font-medium text-warning">You have unsaved changes</p>
            <p className="text-sm text-muted-foreground">
              {Object.keys(dirtyFields).length} field(s) modified
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <FormSection
            title="Basic Information"
            icon={Building2}
            hasChanges={basicInfoChanged}
          >
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
                              setLeiVerified(null);
                            }}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleVerifyLei}
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
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="e.g., US, DE, FR"
                            maxLength={2}
                            className="uppercase"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                          {field.value && (
                            <span className="text-xl">
                              {getCountryFlag(field.value)}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>ISO 3166-1 alpha-2 code</FormDescription>
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
                      <Input
                        placeholder="e.g., European Union, United States"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Classification */}
          <FormSection
            title="Classification"
            icon={Shield}
            hasChanges={classificationChanged}
          >
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
          </FormSection>

          {/* DORA Compliance */}
          <FormSection
            title="DORA Compliance"
            icon={FileText}
            hasChanges={doraChanged}
          >
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
          </FormSection>

          {/* Contact Information */}
          <FormSection
            title="Contact Information"
            icon={Users}
            hasChanges={contactChanged}
            defaultOpen={false}
          >
            <div className="grid gap-4 sm:grid-cols-2">
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
                name="primary_contact.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primary_contact.title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Account Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Additional Notes */}
          <FormSection
            title="Additional Notes"
            icon={FileText}
            hasChanges={notesChanged}
            defaultOpen={false}
          >
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Additional notes about this vendor..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Internal notes about this vendor (not visible to the vendor)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-error text-white hover:bg-error/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Vendor Status?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the status from{' '}
              <strong>{STATUS_INFO[vendor.status].label}</strong> to{' '}
              <strong>{pendingStatus && STATUS_INFO[pendingStatus].label}</strong>.
              {pendingStatus === 'inactive' && (
                <span className="block mt-2 text-warning">
                  Warning: Inactive vendors will not appear in active vendor lists.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Change Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
