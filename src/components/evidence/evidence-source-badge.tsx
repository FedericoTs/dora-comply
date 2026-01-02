'use client';

/**
 * Evidence Source Badge Component
 *
 * Inline indicator showing where a piece of data was extracted from.
 * Provides quick context about data provenance.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Check,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Eye,
  Bot,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ReviewStatus = 'pending' | 'verified' | 'corrected' | 'rejected';
export type ExtractionMethod = 'ai' | 'manual' | 'hybrid';

export interface EvidenceSource {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  sectionReference?: string;
  extractedText?: string;
  confidence?: number;
  extractionMethod?: ExtractionMethod;
  reviewStatus?: ReviewStatus;
  extractedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface EvidenceSourceBadgeProps {
  source: EvidenceSource;
  variant?: 'minimal' | 'compact' | 'full';
  showConfidence?: boolean;
  showReviewStatus?: boolean;
  onViewSource?: (source: EvidenceSource) => void;
  className?: string;
}

const reviewStatusConfig: Record<ReviewStatus, { label: string; color: string; Icon: React.ElementType }> = {
  pending: { label: 'Pending Review', color: 'text-muted-foreground', Icon: HelpCircle },
  verified: { label: 'Verified', color: 'text-success', Icon: Check },
  corrected: { label: 'Corrected', color: 'text-info', Icon: User },
  rejected: { label: 'Rejected', color: 'text-destructive', Icon: AlertTriangle },
};

const extractionMethodConfig: Record<ExtractionMethod, { label: string; Icon: React.ElementType }> = {
  ai: { label: 'AI Extracted', Icon: Bot },
  manual: { label: 'Manual Entry', Icon: User },
  hybrid: { label: 'AI + Manual', Icon: Bot },
};

export function EvidenceSourceBadge({
  source,
  variant = 'compact',
  showConfidence = true,
  showReviewStatus = true,
  onViewSource,
  className,
}: EvidenceSourceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const reviewStatus = source.reviewStatus || 'pending';
  const extractionMethod = source.extractionMethod || 'ai';
  const confidence = source.confidence ?? 0;
  const confidencePercent = Math.round(confidence * 100);

  const ReviewIcon = reviewStatusConfig[reviewStatus].Icon;
  const MethodIcon = extractionMethodConfig[extractionMethod].Icon;

  // Minimal variant: just an icon with tooltip
  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center',
                'h-4 w-4 text-muted-foreground hover:text-foreground transition-colors',
                className
              )}
              onClick={() => onViewSource?.(source)}
            >
              <FileText className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">{source.documentName}</p>
              {source.pageNumber && (
                <p className="text-xs text-muted-foreground">Page {source.pageNumber}</p>
              )}
              {showConfidence && confidencePercent > 0 && (
                <p className="text-xs text-muted-foreground">
                  {confidencePercent}% confidence
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant: badge with popover for details
  if (variant === 'compact') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 cursor-pointer hover:bg-muted/50 transition-colors',
              className
            )}
          >
            <FileText className="h-3 w-3" />
            <span className="max-w-[100px] truncate">{source.documentName}</span>
            {source.pageNumber && (
              <span className="text-muted-foreground">p.{source.pageNumber}</span>
            )}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            {/* Document info */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">{source.documentName}</h4>
                {source.sectionReference && (
                  <p className="text-xs text-muted-foreground">{source.sectionReference}</p>
                )}
              </div>
              {showReviewStatus && (
                <Badge
                  variant="outline"
                  className={cn('gap-1', reviewStatusConfig[reviewStatus].color)}
                >
                  <ReviewIcon className="h-3 w-3" />
                  {reviewStatusConfig[reviewStatus].label}
                </Badge>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {source.pageNumber && (
                <div>
                  <span className="text-muted-foreground">Page:</span>{' '}
                  <span className="font-medium">{source.pageNumber}</span>
                </div>
              )}
              {showConfidence && confidencePercent > 0 && (
                <div>
                  <span className="text-muted-foreground">Confidence:</span>{' '}
                  <span
                    className={cn(
                      'font-medium',
                      confidencePercent >= 80 ? 'text-success' :
                      confidencePercent >= 50 ? 'text-warning' : 'text-destructive'
                    )}
                  >
                    {confidencePercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Extracted text preview */}
            {source.extractedText && (
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground mb-1">Extracted text:</p>
                <p className="text-sm line-clamp-3">{source.extractedText}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MethodIcon className="h-3 w-3" />
                {extractionMethodConfig[extractionMethod].label}
              </div>
              {source.extractedAt && (
                <span>{new Date(source.extractedAt).toLocaleDateString()}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <Link href={`/documents/${source.documentId}`}>
                  <Eye className="mr-1.5 h-3 w-3" />
                  View Document
                </Link>
              </Button>
              {onViewSource && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onViewSource(source);
                    setIsOpen(false);
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full variant: card-like display
  return (
    <div className={cn('rounded-lg border bg-card p-3 space-y-2', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded bg-muted p-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <Link
              href={`/documents/${source.documentId}`}
              className="text-sm font-medium hover:underline"
            >
              {source.documentName}
            </Link>
            {source.sectionReference && (
              <p className="text-xs text-muted-foreground">{source.sectionReference}</p>
            )}
          </div>
        </div>
        {showReviewStatus && (
          <Badge
            variant="outline"
            className={cn('gap-1', reviewStatusConfig[reviewStatus].color)}
          >
            <ReviewIcon className="h-3 w-3" />
            {reviewStatusConfig[reviewStatus].label}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        {source.pageNumber && (
          <div>
            <span className="text-xs text-muted-foreground block">Page</span>
            <span className="font-medium">{source.pageNumber}</span>
          </div>
        )}
        {showConfidence && confidencePercent > 0 && (
          <div>
            <span className="text-xs text-muted-foreground block">Confidence</span>
            <span
              className={cn(
                'font-medium',
                confidencePercent >= 80 ? 'text-success' :
                confidencePercent >= 50 ? 'text-warning' : 'text-destructive'
              )}
            >
              {confidencePercent}%
            </span>
          </div>
        )}
        <div>
          <span className="text-xs text-muted-foreground block">Method</span>
          <div className="flex items-center gap-1">
            <MethodIcon className="h-3 w-3" />
            <span className="text-sm">{extractionMethod}</span>
          </div>
        </div>
      </div>

      {source.extractedText && (
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground mb-1">Extracted text:</p>
          <p className="text-sm line-clamp-2">{source.extractedText}</p>
        </div>
      )}

      {(source.reviewedBy || source.extractedAt) && (
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          {source.extractedAt && (
            <span>Extracted: {new Date(source.extractedAt).toLocaleDateString()}</span>
          )}
          {source.reviewedBy && source.reviewedAt && (
            <span>Reviewed: {new Date(source.reviewedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </div>
  );
}
