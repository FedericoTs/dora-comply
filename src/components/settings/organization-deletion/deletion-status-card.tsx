'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, Ban, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeletionStatus } from './types';
import { ProtectionAlert, ActiveRequestAlert, DeletionItemsList } from './deletion-warnings';

interface DeletionStatusCardProps {
  status: DeletionStatus | null;
  countdown: number | null;
  cancelling: boolean;
  onCancelRequest: () => void;
  onOpenRequestDialog: () => void;
  onOpenConfirmDialog: () => void;
  className?: string;
}

export function DeletionStatusCard({
  status,
  countdown,
  cancelling,
  onCancelRequest,
  onOpenRequestDialog,
  onOpenConfirmDialog,
  className,
}: DeletionStatusCardProps) {
  return (
    <Card className={cn('border-destructive/20', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Delete Organization
        </CardTitle>
        <CardDescription>
          Permanently delete your organization and all associated data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Protection Status */}
        <ProtectionAlert show={!status?.hasActiveRequest} />

        {/* Active Deletion Request */}
        {status && (
          <ActiveRequestAlert status={status} countdown={countdown} />
        )}

        {/* What will be deleted */}
        <DeletionItemsList />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {status?.hasActiveRequest ? (
          <>
            <Button
              variant="outline"
              onClick={onCancelRequest}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Cancel Request
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={onOpenConfirmDialog}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Enter Confirmation Code
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              This action is irreversible
            </p>
            <Button
              variant="destructive"
              onClick={onOpenRequestDialog}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Request Deletion
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
