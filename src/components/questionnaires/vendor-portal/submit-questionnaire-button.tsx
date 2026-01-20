'use client';

/**
 * SubmitQuestionnaireButton Component
 *
 * Button to submit the questionnaire with confirmation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { submitQuestionnaire } from '@/lib/nis2-questionnaire/actions';

interface SubmitQuestionnaireButtonProps {
  token: string;
  disabled?: boolean;
}

export function SubmitQuestionnaireButton({ token, disabled }: SubmitQuestionnaireButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!confirmed) {
      toast.error('Please confirm that your answers are complete and accurate');
      return;
    }

    setLoading(true);
    try {
      const result = await submitQuestionnaire(token, true);

      if (result.success) {
        toast.success('Questionnaire submitted successfully');
        setOpen(false);
        router.push(`/q/${token}/complete`);
      } else {
        toast.error(result.error || 'Failed to submit questionnaire');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={disabled} size="lg">
        <Send className="mr-2 h-4 w-4" />
        Submit Questionnaire
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Submit Questionnaire
            </DialogTitle>
            <DialogDescription>
              Once submitted, your responses will be sent for review. You won&apos;t be able to make
              changes unless the reviewer requests revisions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label htmlFor="confirm" className="text-sm leading-relaxed cursor-pointer">
                I confirm that all answers are complete and accurate to the best of my knowledge. I
                understand that providing false information may have legal consequences.
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !confirmed}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
