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

import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, isPast, addHours } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Trash2,
  Shield,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DeletionStatus {
  hasActiveRequest: boolean;
  requestedAt: string | null;
  requestedBy: string | null;
  expiresAt: string | null;
  requesterEmail: string | null;
}

interface OrganizationDeletionProps {
  organizationId: string;
  organizationName: string;
  className?: string;
  onDeletionComplete?: () => void;
}

export function OrganizationDeletion({
  organizationId,
  organizationName,
  className,
  onDeletionComplete,
}: OrganizationDeletionProps) {
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Dialog state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form state
  const [acknowledgements, setAcknowledgements] = useState({
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
  const handleRequestDeletion = async () => {
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
  };

  // Confirm deletion with code
  const handleConfirmDeletion = async () => {
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
  };

  // Cancel deletion request
  const handleCancelRequest = async () => {
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
  };

  // Format countdown
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

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
          {!status?.hasActiveRequest && (
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
          )}

          {/* Active Deletion Request */}
          {status?.hasActiveRequest && (
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
          )}

          {/* What will be deleted */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h4 className="font-medium text-destructive mb-2">What will be permanently deleted:</h4>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                All vendor records and assessments
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                All documents and version history
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                Register of Information (RoI) data
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                Incident reports and audit logs
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                All team member access and settings
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {status?.hasActiveRequest ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelRequest}
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
                onClick={() => setShowConfirmDialog(true)}
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
                onClick={() => setShowRequestDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Request Deletion
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Request Deletion Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
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
                    setAcknowledgements((prev) => ({ ...prev, dataLoss: !!checked }))
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
                    setAcknowledgements((prev) => ({ ...prev, noRecovery: !!checked }))
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
                    setAcknowledgements((prev) => ({ ...prev, auditTrail: !!checked }))
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
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={
                requesting ||
                !acknowledgements.dataLoss ||
                !acknowledgements.noRecovery ||
                !acknowledgements.auditTrail
              }
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

      {/* Confirm Deletion Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
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
                onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
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
                onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                className={cn(
                  'font-mono',
                  confirmationText === 'DELETE' && 'border-destructive'
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
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeletion}
              disabled={
                confirming ||
                confirmationCode.length !== 6 ||
                confirmationText !== 'DELETE'
              }
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
    </>
  );
}
