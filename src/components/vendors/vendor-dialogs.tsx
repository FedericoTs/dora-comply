'use client';

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
import { STATUS_INFO, type VendorStatus } from '@/lib/vendors/types';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function CancelDialog({ open, onOpenChange, onConfirm }: CancelDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onConfirm}
            className="bg-error text-white hover:bg-error/90"
          >
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: VendorStatus;
  pendingStatus: VendorStatus | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  currentStatus,
  pendingStatus,
  onConfirm,
  onCancel,
}: StatusChangeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Vendor Status?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to change the status from{' '}
            <strong>{STATUS_INFO[currentStatus].label}</strong> to{' '}
            <strong>{pendingStatus && STATUS_INFO[pendingStatus].label}</strong>.
            {pendingStatus === 'inactive' && (
              <span className="block mt-2 text-warning">
                Warning: Inactive vendors will not appear in active vendor lists.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Change Status
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
