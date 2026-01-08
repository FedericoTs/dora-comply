'use client';

/**
 * Evidence Detail Panel Component
 *
 * Full provenance view showing:
 * - Source document with link
 * - Page/section reference
 * - Extraction confidence score
 * - Who extracted/reviewed it and when
 * - Change history
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Check,
  X,
  AlertTriangle,
  Clock,
  User,
  Bot,
  History,
  Eye,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { EvidenceSource, ReviewStatus, ExtractionMethod } from './evidence-source-badge';

interface AuditLogEntry {
  id: string;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changedBy: string;
  changedAt: string;
  changeReason?: string;
}

interface EvidenceDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  source: EvidenceSource | null;
  auditLog?: AuditLogEntry[];
  onVerify?: (source: EvidenceSource) => void;
  onReject?: (source: EvidenceSource) => void;
  onCorrect?: (source: EvidenceSource, newText: string) => void;
}

const actionConfig: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  created: { label: 'Created', color: 'text-success', Icon: Check },
  updated: { label: 'Updated', color: 'text-info', Icon: History },
  deleted: { label: 'Deleted', color: 'text-destructive', Icon: X },
  reviewed: { label: 'Reviewed', color: 'text-info', Icon: Eye },
  verified: { label: 'Verified', color: 'text-success', Icon: Check },
  corrected: { label: 'Corrected', color: 'text-warning', Icon: AlertTriangle },
  rejected: { label: 'Rejected', color: 'text-destructive', Icon: X },
  exported: { label: 'Exported', color: 'text-muted-foreground', Icon: ExternalLink },
  accessed: { label: 'Accessed', color: 'text-muted-foreground', Icon: Eye },
};

export function EvidenceDetailPanel({
  isOpen,
  onClose,
  source,
  auditLog = [],
  onVerify,
  onReject,
  onCorrect,
}: EvidenceDetailPanelProps) {
  if (!source) return null;

  const confidence = source.confidence ?? 0;
  const confidencePercent = Math.round(confidence * 100);

  const getConfidenceColor = (percent: number) => {
    if (percent >= 80) return 'bg-success';
    if (percent >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const getReviewStatusBadge = (status?: ReviewStatus) => {
    const config: Record<ReviewStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pending Review', variant: 'outline' },
      verified: { label: 'Verified', variant: 'default' },
      corrected: { label: 'Corrected', variant: 'secondary' },
      rejected: { label: 'Rejected', variant: 'destructive' },
    };
    const statusConfig = config[status || 'pending'];
    return (
      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Evidence Provenance
          </SheetTitle>
          <SheetDescription>
            View source details and audit history for this data point
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] pr-4 mt-4">
          <div className="space-y-6">
            {/* Source Document Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Source Document
                  {getReviewStatusBadge(source.reviewStatus)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/documents/${source.documentId}`}
                      className="font-medium hover:underline text-sm"
                    >
                      {source.documentName}
                    </Link>
                    {source.sectionReference && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {source.sectionReference}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/documents/${source.documentId}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  {source.pageNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Page</p>
                      <p className="text-sm font-medium">{source.pageNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Extraction Method</p>
                    <div className="flex items-center gap-1.5">
                      {source.extractionMethod === 'ai' && <Bot className="h-4 w-4 text-info" />}
                      {source.extractionMethod === 'manual' && <User className="h-4 w-4 text-success" />}
                      {source.extractionMethod === 'hybrid' && <Bot className="h-4 w-4 text-warning" />}
                      <span className="text-sm capitalize">{source.extractionMethod || 'AI'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confidence Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Progress value={confidencePercent} className={cn('h-2 flex-1 mr-4', getConfidenceColor(confidencePercent))} />
                  <span className={cn(
                    'text-lg font-bold',
                    confidencePercent >= 80 ? 'text-success' :
                    confidencePercent >= 50 ? 'text-warning' : 'text-destructive'
                  )}>
                    {confidencePercent}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {confidencePercent >= 80
                    ? 'High confidence extraction. Data is likely accurate.'
                    : confidencePercent >= 50
                    ? 'Moderate confidence. Manual verification recommended.'
                    : 'Low confidence. Please verify this data manually.'}
                </p>
              </CardContent>
            </Card>

            {/* Extracted Text */}
            {source.extractedText && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Extracted Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    {source.extractedText}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Actions */}
            {(onVerify || onReject || onCorrect) && source.reviewStatus === 'pending' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Review Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  {onVerify && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-success text-success hover:bg-success/10"
                      onClick={() => onVerify(source)}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Verify
                    </Button>
                  )}
                  {onCorrect && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onCorrect(source, '')}
                    >
                      <AlertTriangle className="mr-1.5 h-4 w-4" />
                      Correct
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => onReject(source)}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Audit Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Change History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLog.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No history available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLog.map((entry, index) => {
                      const config = actionConfig[entry.action] || actionConfig.accessed;
                      const Icon = config.Icon;
                      return (
                        <div key={entry.id} className="flex gap-3">
                          <div className={cn(
                            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                            'bg-muted'
                          )}>
                            <Icon className={cn('h-3 w-3', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('text-sm font-medium', config.color)}>
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.changedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              by {entry.changedBy}
                            </p>
                            {entry.changeReason && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                &quot;{entry.changeReason}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {source.extractedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Extracted</p>
                      <p className="font-medium">{new Date(source.extractedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {source.reviewedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reviewed</p>
                      <p className="font-medium">{new Date(source.reviewedAt).toLocaleString()}</p>
                      {source.reviewedBy && (
                        <p className="text-xs text-muted-foreground">by {source.reviewedBy}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
