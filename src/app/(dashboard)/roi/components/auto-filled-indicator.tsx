'use client';

/**
 * Auto-Filled Indicator
 *
 * Visual indicator for fields populated by AI from SOC2 reports
 */

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AutoFilledIndicatorProps {
  source?: string;
  documentName?: string;
  confidence?: number;
  className?: string;
}

/**
 * Inline indicator showing a field was auto-populated
 */
export function AutoFilledIndicator({
  source = 'SOC2 Report',
  documentName,
  confidence,
  className,
}: AutoFilledIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'h-5 px-1.5 gap-1 text-[10px] font-normal',
              'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10',
              className
            )}
          >
            <Sparkles className="h-3 w-3" />
            AI
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Auto-populated by AI</p>
            <p className="text-xs text-muted-foreground">
              Extracted from {source}
              {documentName && `: ${documentName}`}
            </p>
            {confidence !== undefined && (
              <p className="text-xs">
                Confidence: {Math.round(confidence * 100)}%
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Field wrapper that shows auto-fill status
 */
interface AutoFilledFieldProps {
  children: React.ReactNode;
  isAutoFilled: boolean;
  source?: string;
  documentName?: string;
  confidence?: number;
  className?: string;
}

export function AutoFilledField({
  children,
  isAutoFilled,
  source,
  documentName,
  confidence,
  className,
}: AutoFilledFieldProps) {
  if (!isAutoFilled) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <AutoFilledIndicator
          source={source}
          documentName={documentName}
          confidence={confidence}
        />
      </div>
    </div>
  );
}

/**
 * Summary badge showing count of auto-filled fields
 */
interface AutoFilledSummaryProps {
  count: number;
  total: number;
  className?: string;
}

export function AutoFilledSummary({
  count,
  total,
  className,
}: AutoFilledSummaryProps) {
  if (count === 0) return null;

  const percentage = Math.round((count / total) * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              'gap-1 bg-primary/10 text-primary border-primary/20',
              className
            )}
          >
            <Sparkles className="h-3 w-3" />
            {count} AI-filled
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{count} of {total} fields ({percentage}%) were auto-populated from documents</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Confidence indicator bar
 */
interface ConfidenceBarProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBar({ confidence, className }: ConfidenceBarProps) {
  const getColor = () => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}
