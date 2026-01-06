'use client';

/**
 * Validation Message Component
 *
 * Displays validation errors, warnings, and suggestions with fix actions
 */

import { AlertCircle, AlertTriangle, Info, CheckCircle2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ValidationSeverity } from '@/lib/roi/field-validators';

interface ValidationMessageProps {
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  onAutoFix?: () => void;
  canAutoFix?: boolean;
  className?: string;
}

const severityConfig: Record<ValidationSeverity, {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  error: {
    icon: AlertCircle,
    bgClass: 'bg-destructive/5',
    textClass: 'text-destructive',
    borderClass: 'border-destructive/20',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-500/5',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-500/20',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-500/5',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-500/20',
  },
};

export function ValidationMessage({
  severity,
  message,
  suggestion,
  onAutoFix,
  canAutoFix,
  className,
}: ValidationMessageProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-md border',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.textClass)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', config.textClass)}>{message}</p>
        {suggestion && (
          <p className="text-xs text-muted-foreground mt-0.5">{suggestion}</p>
        )}
      </div>
      {canAutoFix && onAutoFix && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 shrink-0"
          onClick={onAutoFix}
        >
          <Wand2 className="h-3 w-3 mr-1" />
          Fix
        </Button>
      )}
    </div>
  );
}

/**
 * Compact inline validation indicator
 */
interface ValidationIndicatorProps {
  isValid: boolean;
  severity?: ValidationSeverity;
  className?: string;
}

export function ValidationIndicator({
  isValid,
  severity = 'error',
  className,
}: ValidationIndicatorProps) {
  if (isValid) {
    return (
      <CheckCircle2
        className={cn('h-4 w-4 text-green-500 shrink-0', className)}
      />
    );
  }

  const config = severityConfig[severity];
  const Icon = config.icon;

  return <Icon className={cn('h-4 w-4 shrink-0', config.textClass, className)} />;
}

/**
 * Validation summary for multiple fields
 */
interface ValidationSummaryProps {
  errors: number;
  warnings: number;
  className?: string;
}

export function ValidationSummary({ errors, warnings, className }: ValidationSummaryProps) {
  if (errors === 0 && warnings === 0) {
    return (
      <div className={cn('flex items-center gap-1.5 text-green-600', className)}>
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">All fields valid</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {errors > 0 && (
        <div className="flex items-center gap-1.5 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {errors} error{errors !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {warnings > 0 && (
        <div className="flex items-center gap-1.5 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {warnings} warning{warnings !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
