import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateVendorSchema, type UpdateVendorFormData } from '@/lib/vendors/schemas';
import {
  type VendorWithRelations,
  type VendorStatus,
  type ServiceType,
  type CTTPDesignationSource,
  type CTTPDesignatingAuthority,
  type OversightPlanStatus,
  type CTTPSubstitutability,
} from '@/lib/vendors/types';
import { updateVendor } from '@/lib/vendors/actions';
import { validateLEI } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';

export function useEditVendorForm(vendor: VendorWithRelations) {
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
    mode: 'onTouched',
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
      // CTPP fields
      is_ctpp: vendor.is_ctpp || false,
      ctpp_designation_date: vendor.ctpp_designation_date || '',
      ctpp_designation_source: vendor.ctpp_designation_source as CTTPDesignationSource | undefined,
      ctpp_designating_authority: vendor.ctpp_designating_authority as CTTPDesignatingAuthority | undefined,
      ctpp_designation_reason: vendor.ctpp_designation_reason || '',
      lead_overseer: vendor.lead_overseer as CTTPDesignatingAuthority | undefined,
      lead_overseer_assigned_date: vendor.lead_overseer_assigned_date || '',
      lead_overseer_contact_email: vendor.lead_overseer_contact_email || '',
      joint_examination_team: vendor.joint_examination_team || false,
      oversight_plan_status: (vendor.oversight_plan_status as OversightPlanStatus) || 'not_applicable',
      ctpp_exit_strategy_documented: vendor.ctpp_exit_strategy_documented || false,
      ctpp_substitutability_assessment: vendor.ctpp_substitutability_assessment as CTTPSubstitutability | undefined,
    },
  });

  const { isDirty, dirtyFields } = form.formState;

  // Track which sections have changes
  const sectionChanges = {
    basicInfo: !!(dirtyFields.name || dirtyFields.lei || dirtyFields.headquarters_country || dirtyFields.jurisdiction),
    classification: !!(dirtyFields.tier || dirtyFields.provider_type || dirtyFields.service_types),
    dora: !!(dirtyFields.supports_critical_function || dirtyFields.critical_functions || dirtyFields.is_intra_group),
    contact: !!dirtyFields.primary_contact,
    notes: !!dirtyFields.notes,
    ctpp: !!(
      dirtyFields.is_ctpp ||
      dirtyFields.ctpp_designation_source ||
      dirtyFields.ctpp_designating_authority ||
      dirtyFields.lead_overseer ||
      dirtyFields.ctpp_exit_strategy_documented ||
      dirtyFields.ctpp_substitutability_assessment
    ),
  };

  // Watch is_ctpp to show/hide CTPP section
  const isCTPP = form.watch('is_ctpp') ?? false;
  const currentStatus = form.watch('status');

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

  const clearLeiVerification = () => setLeiVerified(null);

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

  const cancelStatusChange = () => {
    setPendingStatus(null);
    setShowStatusDialog(false);
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
    // CTPP fields
    if (dirtyFields.is_ctpp) changedData.is_ctpp = data.is_ctpp;
    if (dirtyFields.ctpp_designation_date) changedData.ctpp_designation_date = data.ctpp_designation_date;
    if (dirtyFields.ctpp_designation_source) changedData.ctpp_designation_source = data.ctpp_designation_source;
    if (dirtyFields.ctpp_designating_authority) changedData.ctpp_designating_authority = data.ctpp_designating_authority;
    if (dirtyFields.ctpp_designation_reason) changedData.ctpp_designation_reason = data.ctpp_designation_reason;
    if (dirtyFields.lead_overseer) changedData.lead_overseer = data.lead_overseer;
    if (dirtyFields.lead_overseer_assigned_date) changedData.lead_overseer_assigned_date = data.lead_overseer_assigned_date;
    if (dirtyFields.lead_overseer_contact_email) changedData.lead_overseer_contact_email = data.lead_overseer_contact_email;
    if (dirtyFields.joint_examination_team) changedData.joint_examination_team = data.joint_examination_team;
    if (dirtyFields.oversight_plan_status) changedData.oversight_plan_status = data.oversight_plan_status;
    if (dirtyFields.ctpp_exit_strategy_documented) changedData.ctpp_exit_strategy_documented = data.ctpp_exit_strategy_documented;
    if (dirtyFields.ctpp_substitutability_assessment) changedData.ctpp_substitutability_assessment = data.ctpp_substitutability_assessment;

    const result = await updateVendor(vendor.id, changedData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Vendor updated successfully');
      router.push(`/vendors/${vendor.id}`);
    } else {
      toast.error(result.error?.message || 'Failed to update vendor');
    }
  };

  return {
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
  };
}
