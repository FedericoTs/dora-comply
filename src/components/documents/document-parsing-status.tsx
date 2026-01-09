'use client';

/**
 * Document Parsing Status Indicator
 *
 * Visual indicator showing AI document parsing status with:
 * - Animated processing state
 * - Clear status icons for each state
 * - Tooltips with details
 * - Progress indication for active processing
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// Types
// ============================================================================

export type ParsingStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface DocumentParsingStatusProps {
  status: ParsingStatus;
  /** Optional error message when status is 'failed' */
  error?: string | null;
  /** Timestamp when parsing completed */
  parsedAt?: string | null;
  /** Confidence score (0-1) when parsing completed */
  confidence?: number | null;
  /** Display variant */
  variant?: 'badge' | 'inline' | 'detailed';
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// Status Configuration
// ============================================================================

const STATUS_CONFIG: Record<
  ParsingStatus,
  {
    label: string;
    description: string;
    icon: typeof CheckCircle2;
    badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
    colorClass: string;
    bgClass: string;
  }
> = {
  pending: {
    label: 'Queued',
    description: 'Document is queued for AI analysis',
    icon: Clock,
    badgeVariant: 'secondary',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
  },
  processing: {
    label: 'Analyzing',
    description: 'AI is extracting and analyzing document content',
    icon: Loader2,
    badgeVariant: 'outline',
    colorClass: 'text-info',
    bgClass: 'bg-info/10',
  },
  completed: {
    label: 'Analyzed',
    description: 'AI analysis complete',
    icon: CheckCircle2,
    badgeVariant: 'outline',
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
  },
  failed: {
    label: 'Failed',
    description: 'AI analysis encountered an error',
    icon: XCircle,
    badgeVariant: 'destructive',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// Badge Variant
// ============================================================================

function ParsingStatusBadge({
  status,
  error,
  parsedAt,
  confidence,
  showTooltip,
  className,
}: DocumentParsingStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant={config.badgeVariant}
      className={cn(
        'gap-1',
        status === 'processing' && 'border-info text-info',
        status === 'completed' && 'border-success text-success',
        className
      )}
    >
      <Icon
        className={cn(
          'h-3 w-3',
          status === 'processing' && 'animate-spin'
        )}
      />
      {config.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            {status === 'completed' && parsedAt && (
              <p className="text-xs text-muted-foreground">
                Completed {formatTimestamp(parsedAt)}
              </p>
            )}
            {status === 'completed' && confidence !== null && confidence !== undefined && (
              <p className="text-xs text-muted-foreground">
                Confidence: {formatConfidence(confidence)}
              </p>
            )}
            {status === 'failed' && error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Inline Variant
// ============================================================================

function ParsingStatusInline({
  status,
  error,
  className,
}: DocumentParsingStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Icon
        className={cn(
          'h-4 w-4',
          config.colorClass,
          status === 'processing' && 'animate-spin'
        )}
      />
      <span className={cn('text-sm', config.colorClass)}>{config.label}</span>
    </div>
  );
}

// ============================================================================
// Detailed Variant
// ============================================================================

function ParsingStatusDetailed({
  status,
  error,
  parsedAt,
  confidence,
  className,
}: DocumentParsingStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const [progress, setProgress] = useState(0);

  // Simulate progress for processing state
  useEffect(() => {
    if (status === 'processing') {
      setProgress(10);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (status === 'completed') {
      setProgress(100);
    }
  }, [status]);

  return (
    <div
      className={cn(
        'rounded-lg p-3 border',
        config.bgClass,
        status === 'failed' && 'border-destructive/50',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-full p-2',
            status === 'processing' && 'bg-info/20',
            status === 'completed' && 'bg-success/20',
            status === 'pending' && 'bg-muted-foreground/20',
            status === 'failed' && 'bg-destructive/20'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              config.colorClass,
              status === 'processing' && 'animate-spin'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('font-medium text-sm', config.colorClass)}>
              {status === 'processing' ? 'AI Analysis in Progress' : config.label}
            </p>
            {status === 'completed' && confidence !== null && confidence !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {formatConfidence(confidence)} confidence
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {config.description}
          </p>

          {/* Progress bar for processing */}
          {status === 'processing' && (
            <div className="mt-2 space-y-1">
              <Progress value={progress} className="h-1.5" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Claude is analyzing your document...</span>
              </div>
            </div>
          )}

          {/* Error message for failed */}
          {status === 'failed' && error && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Timestamp for completed */}
          {status === 'completed' && parsedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Analyzed {formatTimestamp(parsedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DocumentParsingStatus({
  variant = 'badge',
  showTooltip = true,
  ...props
}: DocumentParsingStatusProps) {
  switch (variant) {
    case 'inline':
      return <ParsingStatusInline {...props} />;
    case 'detailed':
      return <ParsingStatusDetailed {...props} />;
    default:
      return <ParsingStatusBadge {...props} showTooltip={showTooltip} />;
  }
}

// ============================================================================
// Compact Processing Indicator
// ============================================================================

/**
 * Small animated indicator for processing documents
 * Use in lists/tables where space is limited
 */
export function ProcessingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative">
        <Loader2 className="h-4 w-4 animate-spin text-info" />
        <span className="absolute inset-0 animate-ping rounded-full bg-info/20" />
      </div>
      <span className="text-xs text-info font-medium">Analyzing...</span>
    </div>
  );
}

// ============================================================================
// Export Index
// ============================================================================

export { STATUS_CONFIG as PARSING_STATUS_CONFIG };
