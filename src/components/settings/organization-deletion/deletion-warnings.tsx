'use client';

import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield, Clock, XCircle } from 'lucide-react';
import type { DeletionStatus } from './types';
import { formatCountdown } from './use-organization-deletion';

interface ProtectionAlertProps {
  show: boolean;
}

export function ProtectionAlert({ show }: ProtectionAlertProps) {
  if (!show) return null;

  return (
    <Alert className="border-amber-500/30 bg-amber-500/5">
      <Shield className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Deletion Protection Active
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        Organization deletion requires email verification and a confirmation code.
        All data will be permanently removed with no possibility of recovery.
      </AlertDescription>
    </Alert>
  );
}

interface ActiveRequestAlertProps {
  status: DeletionStatus;
  countdown: number | null;
}

export function ActiveRequestAlert({ status, countdown }: ActiveRequestAlertProps) {
  if (!status.hasActiveRequest) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Deletion Request Pending</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          A deletion request was initiated{' '}
          {status.requestedAt && formatDistanceToNow(new Date(status.requestedAt), { addSuffix: true })}
          {status.requesterEmail && ` by ${status.requesterEmail}`}.
        </p>
        {countdown !== null && countdown > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              Confirmation code expires in:{' '}
              <strong className="font-mono">{formatCountdown(countdown)}</strong>
            </span>
          </div>
        )}
        <p className="text-sm">
          Check your email for the confirmation code to complete the deletion.
        </p>
      </AlertDescription>
    </Alert>
  );
}

export function DeletionItemsList() {
  const items = [
    'All vendor records and assessments',
    'All documents and version history',
    'Register of Information (RoI) data',
    'Incident reports and audit logs',
    'All team member access and settings',
  ];

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <h4 className="font-medium text-destructive mb-2">What will be permanently deleted:</h4>
      <ul className="text-sm text-muted-foreground space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
