'use client';

/**
 * QuestionnaireReviewActions Component
 *
 * Actions for reviewing and approving/rejecting questionnaires
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { reviewQuestionnaire } from '@/lib/nis2-questionnaire/actions';

interface QuestionnaireReviewActionsProps {
  questionnaireId: string;
}

export function QuestionnaireReviewActions({ questionnaireId }: QuestionnaireReviewActionsProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const router = useRouter();

  async function handleApprove() {
    setLoading(true);
    try {
      const result = await reviewQuestionnaire(questionnaireId, {
        status: 'approved',
        review_notes: notes || undefined,
      });

      if (result.success) {
        toast.success('Questionnaire approved');
        setApproveOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to approve');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const result = await reviewQuestionnaire(questionnaireId, {
        status: 'rejected',
        review_notes: notes,
      });

      if (result.success) {
        toast.success('Questionnaire returned to vendor');
        setRejectOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to reject');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => setRejectOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <XCircle className="mr-2 h-4 w-4" />
        Request Changes
      </Button>
      <Button onClick={() => setApproveOpen(true)}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Approve
      </Button>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Approve Questionnaire
            </DialogTitle>
            <DialogDescription>
              Approve the vendor&apos;s questionnaire responses. This will mark the assessment as
              complete.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Review Notes (optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any notes about this review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Request Changes
            </DialogTitle>
            <DialogDescription>
              Return the questionnaire to the vendor for revisions. They will be notified and can
              update their responses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">
                Reason for Rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-notes"
                placeholder="Explain what changes are needed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This message will be visible to the vendor
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || !notes.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
