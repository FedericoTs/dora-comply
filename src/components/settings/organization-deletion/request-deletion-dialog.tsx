'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Mail, Loader2 } from 'lucide-react';
import type { Acknowledgements } from './types';

interface RequestDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  acknowledgements: Acknowledgements;
  onAcknowledgementChange: (key: keyof Acknowledgements, value: boolean) => void;
  requesting: boolean;
  onRequestDeletion: () => void;
}

export function RequestDeletionDialog({
  open,
  onOpenChange,
  organizationName,
  acknowledgements,
  onAcknowledgementChange,
  requesting,
  onRequestDeletion,
}: RequestDeletionDialogProps) {
  const allAcknowledged =
    acknowledgements.dataLoss &&
    acknowledgements.noRecovery &&
    acknowledgements.auditTrail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Request Organization Deletion
          </DialogTitle>
          <DialogDescription>
            You are about to initiate the deletion of <strong>{organizationName}</strong>.
            Please acknowledge the following:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Acknowledgements */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="data-loss"
                checked={acknowledgements.dataLoss}
                onCheckedChange={(checked) =>
                  onAcknowledgementChange('dataLoss', !!checked)
                }
              />
              <Label htmlFor="data-loss" className="text-sm leading-tight cursor-pointer">
                I understand that all organization data will be permanently deleted, including
                vendors, documents, assessments, and compliance records.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="no-recovery"
                checked={acknowledgements.noRecovery}
                onCheckedChange={(checked) =>
                  onAcknowledgementChange('noRecovery', !!checked)
                }
              />
              <Label htmlFor="no-recovery" className="text-sm leading-tight cursor-pointer">
                I understand that this action cannot be undone and data cannot be recovered
                after deletion is confirmed.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="audit-trail"
                checked={acknowledgements.auditTrail}
                onCheckedChange={(checked) =>
                  onAcknowledgementChange('auditTrail', !!checked)
                }
              />
              <Label htmlFor="audit-trail" className="text-sm leading-tight cursor-pointer">
                I understand that a record of this deletion will be retained for regulatory
                audit purposes.
              </Label>
            </div>
          </div>

          <Separator />

          <Alert className="border-info/50 bg-info/5">
            <Mail className="h-4 w-4 text-info" />
            <AlertDescription className="text-sm">
              A confirmation code will be sent to your email. The code expires after 24 hours.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onRequestDeletion}
            disabled={requesting || !allAcknowledged}
          >
            {requesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Confirmation Code
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
