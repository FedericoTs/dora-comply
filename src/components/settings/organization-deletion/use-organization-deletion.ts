'use client';

import { useState, useEffect, useCallback } from 'react';
import { isPast } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { DeletionStatus, Acknowledgements } from './types';

interface UseOrganizationDeletionProps {
  organizationId: string;
  onDeletionComplete?: () => void;
}

export function useOrganizationDeletion({
  organizationId,
  onDeletionComplete,
}: UseOrganizationDeletionProps) {
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Dialog state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form state
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgements>({
    dataLoss: false,
    noRecovery: false,
    auditTrail: false,
  });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Fetch deletion status
  const fetchStatus = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        deletion_requested_at,
        deletion_requested_by,
        deletion_confirmation_expires_at,
        requester:users!deletion_requested_by(email)
      `)
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching deletion status:', error);
      setLoading(false);
      return;
    }

    const hasActiveRequest =
      data.deletion_requested_at !== null &&
      data.deletion_confirmation_expires_at !== null &&
      !isPast(new Date(data.deletion_confirmation_expires_at));

    setStatus({
      hasActiveRequest,
      requestedAt: data.deletion_requested_at,
      requestedBy: data.deletion_requested_by,
      expiresAt: data.deletion_confirmation_expires_at,
      requesterEmail: Array.isArray(data.requester)
        ? data.requester[0]?.email
        : data.requester?.email || null,
    });
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Update countdown timer
  useEffect(() => {
    if (!status?.hasActiveRequest || !status.expiresAt) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expires = new Date(status.expiresAt!);
      const diff = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
      setCountdown(diff);

      // Refresh status if expired
      if (diff === 0) {
        fetchStatus();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status?.hasActiveRequest, status?.expiresAt, fetchStatus]);

  // Request deletion
  const handleRequestDeletion = useCallback(async () => {
    if (!acknowledgements.dataLoss || !acknowledgements.noRecovery || !acknowledgements.auditTrail) {
      toast.error('Please acknowledge all requirements');
      return;
    }

    setRequesting(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.rpc('request_organization_deletion', {
        p_organization_id: organizationId,
      });

      if (error) throw error;

      toast.success('Deletion request initiated', {
        description: 'A confirmation code has been sent to your email.',
      });

      setShowRequestDialog(false);
      setAcknowledgements({ dataLoss: false, noRecovery: false, auditTrail: false });
      await fetchStatus();
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast.error('Failed to request deletion', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setRequesting(false);
    }
  }, [acknowledgements, organizationId, fetchStatus]);

  // Confirm deletion with code
  const handleConfirmDeletion = useCallback(async () => {
    if (!confirmationCode || confirmationCode.length !== 6) {
      toast.error('Please enter the 6-digit confirmation code');
      return;
    }

    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setConfirming(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.rpc('confirm_organization_deletion', {
        p_organization_id: organizationId,
        p_confirmation_code: confirmationCode,
      });

      if (error) {
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          toast.error('Invalid or expired confirmation code', {
            description: 'Please request a new deletion code.',
          });
        } else {
          throw error;
        }
        return;
      }

      toast.success('Organization deleted', {
        description: 'Your organization and all data have been permanently deleted.',
      });

      setShowConfirmDialog(false);
      onDeletionComplete?.();
    } catch (error) {
      console.error('Error confirming deletion:', error);
      toast.error('Failed to delete organization', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setConfirming(false);
    }
  }, [confirmationCode, confirmationText, organizationId, onDeletionComplete]);

  // Cancel deletion request
  const handleCancelRequest = useCallback(async () => {
    setCancelling(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('organizations')
        .update({
          deletion_requested_at: null,
          deletion_requested_by: null,
          deletion_confirmation_code: null,
          deletion_confirmation_expires_at: null,
        })
        .eq('id', organizationId);

      if (error) throw error;

      toast.success('Deletion request cancelled');
      await fetchStatus();
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      toast.error('Failed to cancel deletion request');
    } finally {
      setCancelling(false);
    }
  }, [organizationId, fetchStatus]);

  // Update acknowledgement
  const updateAcknowledgement = useCallback((key: keyof Acknowledgements, value: boolean) => {
    setAcknowledgements((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Update confirmation code (digits only)
  const updateConfirmationCode = useCallback((value: string) => {
    setConfirmationCode(value.replace(/\D/g, ''));
  }, []);

  // Update confirmation text (uppercase)
  const updateConfirmationText = useCallback((value: string) => {
    setConfirmationText(value.toUpperCase());
  }, []);

  return {
    // Status
    status,
    loading,
    countdown,
    // Loading states
    requesting,
    confirming,
    cancelling,
    // Dialog state
    showRequestDialog,
    setShowRequestDialog,
    showConfirmDialog,
    setShowConfirmDialog,
    // Form state
    acknowledgements,
    updateAcknowledgement,
    confirmationCode,
    updateConfirmationCode,
    confirmationText,
    updateConfirmationText,
    // Handlers
    handleRequestDeletion,
    handleConfirmDeletion,
    handleCancelRequest,
  };
}

// Format countdown utility
export function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}
