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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCountdown } from './use-organization-deletion';

interface ConfirmDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmationCode: string;
  onConfirmationCodeChange: (value: string) => void;
  confirmationText: string;
  onConfirmationTextChange: (value: string) => void;
  countdown: number | null;
  confirming: boolean;
  onConfirmDeletion: () => void;
}

export function ConfirmDeletionDialog({
  open,
  onOpenChange,
  confirmationCode,
  onConfirmationCodeChange,
  confirmationText,
  onConfirmationTextChange,
  countdown,
  confirming,
  onConfirmDeletion,
}: ConfirmDeletionDialogProps) {
  const isCodeValid = confirmationCode.length === 6;
  const isTextValid = confirmationText === 'DELETE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Confirm Organization Deletion
          </DialogTitle>
          <DialogDescription>
            Enter the confirmation code sent to your email and type DELETE to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Confirmation Code Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-code">Confirmation Code</Label>
            <Input
              id="confirmation-code"
              placeholder="123456"
              maxLength={6}
              value={confirmationCode}
              onChange={(e) => onConfirmationCodeChange(e.target.value)}
              className="font-mono text-center text-lg tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code from your email
            </p>
          </div>

          <Separator />

          {/* Type DELETE to confirm */}
          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-text"
              placeholder="DELETE"
              value={confirmationText}
              onChange={(e) => onConfirmationTextChange(e.target.value)}
              className={cn(
                'font-mono',
                isTextValid && 'border-destructive'
              )}
            />
          </div>

          {countdown !== null && countdown > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Code expires in: <strong className="font-mono">{formatCountdown(countdown)}</strong>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmDeletion}
            disabled={confirming || !isCodeValid || !isTextValid}
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Organization
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
