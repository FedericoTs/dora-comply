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
import { ROLE_CONFIG, type ConfirmAction } from '@/lib/settings/team-constants';

interface ConfirmActionDialogProps {
  action: ConfirmAction | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmActionDialog({
  action,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={!!action} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action?.type === 'remove'
              ? 'Remove team member?'
              : 'Change role?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action?.type === 'remove' ? (
              <>
                Are you sure you want to remove <strong>{action?.memberName}</strong> from the team?
                They will lose access to all organization data immediately.
              </>
            ) : (
              <>
                Change <strong>{action?.memberName}</strong>&apos;s role to{' '}
                <strong>{ROLE_CONFIG[action?.newRole as keyof typeof ROLE_CONFIG]?.label}</strong>?
                This will change their permissions immediately.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={action?.type === 'remove' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {action?.type === 'remove' ? 'Remove' : 'Change Role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
