'use client';

/**
 * Organization Deletion Flow
 *
 * Multi-step confirmation process for organization deletion with:
 * - Initial warning and request submission
 * - Email-based confirmation code verification
 * - Final confirmation with typed confirmation text
 * - Countdown timer and cancellation option
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrganizationDeletionProps } from './types';
import { useOrganizationDeletion } from './use-organization-deletion';
import { DeletionStatusCard } from './deletion-status-card';
import { RequestDeletionDialog } from './request-deletion-dialog';
import { ConfirmDeletionDialog } from './confirm-deletion-dialog';

export function OrganizationDeletion({
  organizationId,
  organizationName,
  className,
  onDeletionComplete,
}: OrganizationDeletionProps) {
  const {
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
  } = useOrganizationDeletion({
    organizationId,
    onDeletionComplete,
  });

  if (loading) {
    return (
      <Card className={cn('border-destructive/20', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <DeletionStatusCard
        status={status}
        countdown={countdown}
        cancelling={cancelling}
        onCancelRequest={handleCancelRequest}
        onOpenRequestDialog={() => setShowRequestDialog(true)}
        onOpenConfirmDialog={() => setShowConfirmDialog(true)}
        className={className}
      />

      {/* Request Deletion Dialog */}
      <RequestDeletionDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        organizationName={organizationName}
        acknowledgements={acknowledgements}
        onAcknowledgementChange={updateAcknowledgement}
        requesting={requesting}
        onRequestDeletion={handleRequestDeletion}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDeletionDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        confirmationCode={confirmationCode}
        onConfirmationCodeChange={updateConfirmationCode}
        confirmationText={confirmationText}
        onConfirmationTextChange={updateConfirmationText}
        countdown={countdown}
        confirming={confirming}
        onConfirmDeletion={handleConfirmDeletion}
      />
    </>
  );
}
