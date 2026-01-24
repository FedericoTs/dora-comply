'use client';

/**
 * Add Evidence Dialog Component
 *
 * Dialog for adding evidence to a remediation action.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image,
  Link as LinkIcon,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { EvidenceType } from '@/lib/remediation/types';
import { addEvidence } from '@/lib/remediation/actions';
import { toast } from 'sonner';

const EVIDENCE_TYPES: { value: EvidenceType; label: string; icon: typeof FileText; description: string }[] = [
  {
    value: 'document',
    label: 'Document',
    icon: FileText,
    description: 'Upload or link to a document (PDF, Word, etc.)',
  },
  {
    value: 'screenshot',
    label: 'Screenshot',
    icon: Image,
    description: 'Screenshot showing evidence of completion',
  },
  {
    value: 'url',
    label: 'URL Link',
    icon: LinkIcon,
    description: 'Link to external evidence (e.g., ticket, PR)',
  },
  {
    value: 'attestation',
    label: 'Attestation',
    icon: FileCheck,
    description: 'Written statement attesting to completion',
  },
  {
    value: 'report',
    label: 'Report',
    icon: FileText,
    description: 'Formal report or audit finding',
  },
  {
    value: 'other',
    label: 'Other',
    icon: FileText,
    description: 'Other type of evidence',
  },
];

interface AddEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionId: string;
  onSuccess?: () => void;
}

export function AddEvidenceDialog({
  open,
  onOpenChange,
  actionId,
  onSuccess,
}: AddEvidenceDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('document');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [attestationText, setAttestationText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (evidenceType === 'url' && !externalUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (evidenceType === 'attestation' && !attestationText.trim()) {
      toast.error('Please enter the attestation text');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addEvidence({
        action_id: actionId,
        evidence_type: evidenceType,
        title: title.trim(),
        description: description.trim() || undefined,
        external_url: externalUrl.trim() || undefined,
        attestation_text: attestationText.trim() || undefined,
      });

      if (result.success) {
        toast.success('Evidence added successfully');
        // Reset form
        setTitle('');
        setDescription('');
        setExternalUrl('');
        setAttestationText('');
        setEvidenceType('document');
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add evidence');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const selectedType = EVIDENCE_TYPES.find((t) => t.value === evidenceType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Evidence</DialogTitle>
            <DialogDescription>
              Attach evidence to support the completion of this action.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Evidence Type */}
            <div className="grid gap-2">
              <Label>Evidence Type</Label>
              <Select
                value={evidenceType}
                onValueChange={(value) => setEvidenceType(value as EvidenceType)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-xs text-muted-foreground">
                  {selectedType.description}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., MFA Implementation Screenshot"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this evidence demonstrates..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={2}
              />
            </div>

            {/* URL (for URL type) */}
            {(evidenceType === 'url' || evidenceType === 'document' || evidenceType === 'report') && (
              <div className="grid gap-2">
                <Label htmlFor="external_url">
                  {evidenceType === 'url' ? 'URL *' : 'External URL'}
                </Label>
                <Input
                  id="external_url"
                  type="url"
                  placeholder="https://..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Attestation Text (for attestation type) */}
            {evidenceType === 'attestation' && (
              <div className="grid gap-2">
                <Label htmlFor="attestation_text">Attestation Statement *</Label>
                <Textarea
                  id="attestation_text"
                  placeholder="I attest that..."
                  value={attestationText}
                  onChange={(e) => setAttestationText(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Write a formal statement attesting to the completion of this action.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Evidence
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
