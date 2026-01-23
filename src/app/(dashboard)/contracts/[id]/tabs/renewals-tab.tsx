/**
 * Contract Renewals Tab
 * Displays contract renewal history and pending renewals
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  X,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react';
import type { ContractDetail } from '@/lib/contracts/queries';
import type { ContractRenewal } from '@/lib/contracts/types';
import { RENEWAL_TYPE_INFO, RENEWAL_STATUS_INFO } from '@/lib/contracts/types';
import { approveRenewal, rejectRenewal } from '@/lib/contracts/actions';
import { NewRenewalDialog } from '@/components/contracts/new-renewal-dialog';

interface ContractRenewalsTabProps {
  contract: ContractDetail;
}

export function ContractRenewalsTab({ contract }: ContractRenewalsTabProps) {
  const renewals = contract.renewals || [];

  // Group renewals
  const pendingRenewals = renewals.filter(
    (r) => r.status === 'pending' || r.status === 'under_review'
  );
  const completedRenewals = renewals.filter(
    (r) => r.status === 'completed' || r.status === 'approved' || r.status === 'rejected'
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-semibold">{renewals.length}</p>
                <p className="text-xs text-muted-foreground">Total Renewals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-semibold">{pendingRenewals.length}</p>
                <p className="text-xs text-muted-foreground">Pending Decision</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-semibold">
                  {renewals.filter((r) => r.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {contract.auto_renewal ? (
                <RefreshCw className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {contract.auto_renewal ? 'Auto-Renewal' : 'Manual'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contract.auto_renewal && contract.termination_notice_days
                    ? `${contract.termination_notice_days}d notice`
                    : 'Renewal Type'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Renewal */}
      {contract.status !== 'expired' && contract.status !== 'terminated' && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Start Renewal Process</h3>
                <p className="text-sm text-muted-foreground">
                  Initiate a new renewal for this contract
                </p>
              </div>
              <NewRenewalDialog
                contractId={contract.id}
                currentExpiryDate={contract.expiry_date}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Renewals */}
      {pendingRenewals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Clock className="h-5 w-5" />
              Pending Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRenewals.map((renewal) => (
                <RenewalCard key={renewal.id} renewal={renewal} isPending />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Renewal History */}
      <Card>
        <CardHeader>
          <CardTitle>Renewal History</CardTitle>
        </CardHeader>
        <CardContent>
          {completedRenewals.length === 0 && pendingRenewals.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Renewal History</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contract renewals will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedRenewals.map((renewal) => (
                <RenewalCard key={renewal.id} renewal={renewal} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RenewalCard({ renewal, isPending = false }: { renewal: ContractRenewal; isPending?: boolean }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const router = useRouter();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approveRenewal(renewal.id);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error approving renewal:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const result = await rejectRenewal(renewal.id, rejectNotes || undefined);
      if (result.success) {
        setShowRejectDialog(false);
        setRejectNotes('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error rejecting renewal:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const valueChangeIcon =
    renewal.value_change && renewal.value_change > 0 ? (
      <TrendingUp className="h-4 w-4 text-error" />
    ) : renewal.value_change && renewal.value_change < 0 ? (
      <TrendingDown className="h-4 w-4 text-success" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <>
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Renewal #{renewal.renewal_number}</span>
              <Badge variant="outline" className={RENEWAL_STATUS_INFO[renewal.status]?.color || ''}>
                {RENEWAL_STATUS_INFO[renewal.status]?.label}
              </Badge>
              <Badge variant="secondary">
                {RENEWAL_TYPE_INFO[renewal.renewal_type]?.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Previous Expiry: {new Date(renewal.previous_expiry_date).toLocaleDateString()}
              </span>
              {renewal.new_expiry_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  New Expiry: {new Date(renewal.new_expiry_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Value Change */}
            {renewal.value_change !== null && renewal.value_change !== 0 && (
              <div className="flex items-center gap-2 text-sm">
                {valueChangeIcon}
                <span
                  className={
                    renewal.value_change > 0
                      ? 'text-error'
                      : renewal.value_change < 0
                      ? 'text-success'
                      : ''
                  }
                >
                  {renewal.value_change > 0 ? '+' : ''}
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(renewal.value_change)}
                  {renewal.value_change_percent && ` (${renewal.value_change_percent > 0 ? '+' : ''}${renewal.value_change_percent}%)`}
                </span>
              </div>
            )}

            {/* Terms Changed */}
            {renewal.terms_changed && renewal.terms_change_summary && (
              <div className="text-sm">
                <span className="text-muted-foreground">Terms Changed: </span>
                {renewal.terms_change_summary}
              </div>
            )}

            {/* Decision Info */}
            {renewal.decision_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Decision on {new Date(renewal.decision_date).toLocaleDateString()}
                {renewal.decision_notes && `: ${renewal.decision_notes}`}
              </div>
            )}

            {/* Due Date for Pending */}
            {isPending && renewal.due_date && (
              <div className="flex items-center gap-2 text-sm text-warning">
                <Clock className="h-4 w-4" />
                Decision due by {new Date(renewal.due_date).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Actions for Pending */}
          {isPending && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectDialog(true)}
                disabled={isApproving}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Renewal</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this renewal? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-notes">Rejection Reason</Label>
              <Textarea
                id="reject-notes"
                placeholder="Enter the reason for rejection..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject Renewal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
