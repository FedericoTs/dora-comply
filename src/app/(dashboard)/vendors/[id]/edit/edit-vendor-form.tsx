'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  Loader2,
  Save,
  X,
  Building2,
  Shield,
  Users,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { STATUS_INFO, type VendorWithRelations, type VendorStatus } from '@/lib/vendors/types';
import { useEditVendorForm } from '@/hooks/use-edit-vendor-form';
import {
  FormSection,
  BasicInfoFields,
  ClassificationFields,
  DoraComplianceFields,
  CtppOversightFields,
  ContactFields,
  NotesField,
  CancelDialog,
  StatusChangeDialog,
} from '@/components/vendors';

interface EditVendorFormProps {
  vendor: VendorWithRelations;
}

export function EditVendorForm({ vendor }: EditVendorFormProps) {
  const {
    form,
    isDirty,
    dirtyFields,
    sectionChanges,
    isCTPP,
    currentStatus,
    // LEI verification
    isVerifyingLei,
    leiVerified,
    handleVerifyLei,
    clearLeiVerification,
    // Status change
    handleStatusChange,
    confirmStatusChange,
    cancelStatusChange,
    showStatusDialog,
    setShowStatusDialog,
    pendingStatus,
    // Cancel
    handleCancel,
    confirmCancel,
    showCancelDialog,
    setShowCancelDialog,
    // Submit
    isSubmitting,
    onSubmit,
  } = useEditVendorForm(vendor);

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
            hasChanges={sectionChanges.basicInfo}
          >
            <BasicInfoFields
              form={form}
              isVerifyingLei={isVerifyingLei}
              leiVerified={leiVerified}
              onVerifyLei={handleVerifyLei}
              onLeiChange={clearLeiVerification}
            />
          </FormSection>

          {/* Classification */}
          <FormSection
            title="Classification"
            icon={Shield}
            hasChanges={sectionChanges.classification}
          >
            <ClassificationFields form={form} />
          </FormSection>

          {/* DORA Compliance */}
          <FormSection
            title="DORA Compliance"
            icon={FileText}
            hasChanges={sectionChanges.dora}
          >
            <DoraComplianceFields form={form} />
          </FormSection>

          {/* CTPP Oversight */}
          <FormSection
            title="CTPP Oversight"
            icon={Shield}
            hasChanges={sectionChanges.ctpp}
            defaultOpen={isCTPP || vendor.is_ctpp}
          >
            <CtppOversightFields form={form} isCTPP={isCTPP} />
          </FormSection>

          {/* Contact Information */}
          <FormSection
            title="Contact Information"
            icon={Users}
            hasChanges={sectionChanges.contact}
            defaultOpen={false}
          >
            <ContactFields form={form} />
          </FormSection>

          {/* Additional Notes */}
          <FormSection
            title="Additional Notes"
            icon={FileText}
            hasChanges={sectionChanges.notes}
            defaultOpen={false}
          >
            <NotesField form={form} />
          </FormSection>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <CancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={confirmCancel}
      />

      {/* Status Change Confirmation Dialog */}
      <StatusChangeDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        currentStatus={vendor.status}
        pendingStatus={pendingStatus}
        onConfirm={confirmStatusChange}
        onCancel={cancelStatusChange}
      />
    </div>
  );
}
