'use client';

/**
 * Evidence List Component
 *
 * Displays evidence attached to a remediation action with verification status.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Image,
  Link as LinkIcon,
  CheckCircle2,
  FileCheck,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Shield,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import type { RemediationEvidence, EvidenceType } from '@/lib/remediation/types';
import { verifyEvidence, deleteEvidence } from '@/lib/remediation/actions';
import { toast } from 'sonner';

const EVIDENCE_TYPE_INFO: Record<EvidenceType, { label: string; icon: typeof FileText }> = {
  document: { label: 'Document', icon: FileText },
  screenshot: { label: 'Screenshot', icon: Image },
  url: { label: 'URL', icon: LinkIcon },
  attestation: { label: 'Attestation', icon: FileCheck },
  report: { label: 'Report', icon: FileText },
  other: { label: 'Other', icon: FileText },
};

interface EvidenceListProps {
  evidence: RemediationEvidence[];
  actionId: string;
  canVerify?: boolean;
  onEvidenceChange?: () => void;
}

export function EvidenceList({
  evidence,
  actionId,
  canVerify = false,
  onEvidenceChange,
}: EvidenceListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RemediationEvidence | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const handleVerify = async (evidenceId: string, notes?: string) => {
    setIsVerifying(evidenceId);
    try {
      const result = await verifyEvidence(evidenceId, notes);
      if (result.success) {
        toast.success('Evidence verified');
        onEvidenceChange?.();
      } else {
        toast.error(result.error || 'Failed to verify evidence');
      }
    } finally {
      setIsVerifying(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteEvidence(deleteTarget.id);
      if (result.success) {
        toast.success('Evidence deleted');
        onEvidenceChange?.();
      } else {
        toast.error(result.error || 'Failed to delete evidence');
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (evidence.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No evidence attached yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {evidence.map((item) => {
          const typeInfo = EVIDENCE_TYPE_INFO[item.evidence_type];
          const Icon = typeInfo.icon;
          const isVerified = !!item.verified_at;

          return (
            <Card key={item.id} className={cn(isVerified && 'border-success/50')}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isVerified ? 'bg-success/10' : 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isVerified ? 'text-success' : 'text-muted-foreground'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {typeInfo.label}
                      </Badge>
                      {isVerified && (
                        <Badge className="bg-success/10 text-success text-xs shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Type-specific content */}
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {item.external_url}
                      </a>
                    )}

                    {item.attestation_text && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs italic">
                        "{item.attestation_text}"
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </span>
                      {isVerified && item.verified_at && (
                        <span className="flex items-center gap-1 text-success">
                          <Shield className="h-3 w-3" />
                          Verified {format(new Date(item.verified_at), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.document_id && (
                        <DropdownMenuItem asChild>
                          <a href={`/documents/${item.document_id}`} target="_blank">
                            <FileText className="h-4 w-4 mr-2" />
                            View Document
                          </a>
                        </DropdownMenuItem>
                      )}
                      {item.external_url && (
                        <DropdownMenuItem asChild>
                          <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Link
                          </a>
                        </DropdownMenuItem>
                      )}
                      {canVerify && !isVerified && (
                        <DropdownMenuItem
                          onClick={() => handleVerify(item.id)}
                          disabled={isVerifying === item.id}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {isVerifying === item.id ? 'Verifying...' : 'Verify Evidence'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(item)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
