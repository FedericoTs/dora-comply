'use client';

/**
 * Fix Suggestion Component
 *
 * Actionable suggestions for fixing validation issues
 */

import { useState } from 'react';
import {
  Wand2,
  ChevronRight,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FixAction {
  id: string;
  label: string;
  description?: string;
  type: 'auto' | 'manual' | 'link' | 'copy';
  value?: string;
  url?: string;
  onApply?: () => Promise<void> | void;
}

interface FixSuggestionProps {
  title: string;
  description?: string;
  actions: FixAction[];
  className?: string;
}

export function FixSuggestion({
  title,
  description,
  actions,
  className,
}: FixSuggestionProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const handleAction = async (action: FixAction) => {
    if (action.type === 'link' && action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action.type === 'copy' && action.value) {
      await navigator.clipboard.writeText(action.value);
      setCopiedAction(action.id);
      setTimeout(() => setCopiedAction(null), 2000);
      return;
    }

    if (action.onApply) {
      setLoadingAction(action.id);
      try {
        await action.onApply();
      } finally {
        setLoadingAction(null);
      }
    }
  };

  return (
    <Card className={cn('border-primary/20 bg-primary/5', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Wand2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="w-full justify-between h-auto py-2 px-3"
            onClick={() => handleAction(action)}
            disabled={loadingAction === action.id}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">{action.label}</span>
              {action.description && (
                <span className="text-xs text-muted-foreground">{action.description}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {action.type === 'auto' && (
                <Badge variant="secondary" className="text-[10px] px-1.5">Auto</Badge>
              )}
              {loadingAction === action.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : copiedAction === action.id ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : action.type === 'link' ? (
                <ExternalLink className="h-4 w-4" />
              ) : action.type === 'copy' ? (
                <Copy className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Inline fix button for single quick fixes
 */
interface QuickFixButtonProps {
  label?: string;
  onFix: () => void;
  isLoading?: boolean;
  className?: string;
}

export function QuickFixButton({
  label = 'Fix',
  onFix,
  isLoading = false,
  className,
}: QuickFixButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-7 px-2 text-primary hover:text-primary', className)}
      onClick={onFix}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <Wand2 className="h-3 w-3 mr-1" />
      )}
      {label}
    </Button>
  );
}

/**
 * Fix suggestions panel for multiple issues
 */
interface FixSuggestionsPanelProps {
  issues: Array<{
    fieldId: string;
    fieldName: string;
    message: string;
    suggestion?: string;
    actions?: FixAction[];
  }>;
  onFixAll?: () => void;
  className?: string;
}

export function FixSuggestionsPanel({
  issues,
  onFixAll,
  className,
}: FixSuggestionsPanelProps) {
  const autoFixableCount = issues.filter(i =>
    i.actions?.some(a => a.type === 'auto')
  ).length;

  if (issues.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Fix Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            {issues.length} issue{issues.length !== 1 ? 's' : ''} found
            {autoFixableCount > 0 && ` • ${autoFixableCount} can be auto-fixed`}
          </p>
        </div>
        {autoFixableCount > 0 && onFixAll && (
          <Button size="sm" onClick={onFixAll}>
            <Wand2 className="h-4 w-4 mr-2" />
            Fix All ({autoFixableCount})
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {issues.map((issue, index) => (
          <div
            key={`${issue.fieldId}-${index}`}
            className="rounded-lg border p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{issue.fieldName}</p>
                <p className="text-sm text-destructive">{issue.message}</p>
                {issue.suggestion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {issue.suggestion}
                  </p>
                )}
              </div>
            </div>

            {issue.actions && issue.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {issue.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={() => action.onApply?.()}
                  >
                    {action.type === 'auto' && <Wand2 className="h-3 w-3 mr-1" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
