'use client';

/**
 * Delete Factor Dialog Component
 *
 * Confirmation dialog for removing MFA factor
 */

import { Loader2 } from 'lucide-react';
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
import type { MFAFactor, UserRole } from '@/lib/auth/types';
import { MFA_REQUIRED_ROLES } from './types';

interface DeleteFactorDialogProps {
  factor: MFAFactor | null;
  factorsCount: number;
  userRole: UserRole | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteFactorDialog({
  factor,
  factorsCount,
  userRole,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteFactorDialogProps) {
  const mfaRequired = userRole && MFA_REQUIRED_ROLES.includes(userRole);

  return (
    <AlertDialog open={!!factor} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Authenticator?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the authenticator from your account. You&apos;ll need to set up
            a new one if you want to use two-factor authentication.
            {mfaRequired && factorsCount === 1 && (
              <span className="block mt-2 text-destructive font-medium">
                Warning: As an {userRole}, you are required to have MFA enabled.
                You will need to set up a new authenticator immediately.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Authenticator'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
