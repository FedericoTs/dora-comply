'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import type { ValidationError, RoiTemplateId } from '@/lib/roi/types';

interface ErrorListProps {
  errors: ValidationError[];
  groupBy?: 'template' | 'severity' | 'rule';
}

type GroupedErrors = Map<string, ValidationError[]>;

export function ErrorList({ errors, groupBy = 'template' }: ErrorListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Group errors
  const grouped: GroupedErrors = new Map();
  errors.forEach((error) => {
    let key: string;
    switch (groupBy) {
      case 'severity':
        key = error.severity;
        break;
      case 'rule':
        key = error.rule;
        break;
      default:
        key = error.templateId;
    }
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(error);
  });

  // Sort groups by error count (descending)
  const sortedGroups = Array.from(grouped.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  if (errors.length === 0) {
    return (
      <Card className="border-success/30 bg-success/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-success">
            <Info className="h-5 w-5" />
            <p>All templates pass ESA validation. Ready for export!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedGroups.map(([groupKey, groupErrors]) => {
        const isExpanded = expandedGroups.has(groupKey);
        const errorCount = groupErrors.filter((e) => e.severity === 'error').length;
        const warningCount = groupErrors.filter((e) => e.severity === 'warning').length;

        return (
          <Card key={groupKey} className={cn(
            'overflow-hidden',
            errorCount > 0 && 'border-error/30',
            errorCount === 0 && warningCount > 0 && 'border-warning/30'
          )}>
            <CardHeader
              className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-base font-medium">
                    {groupBy === 'template' ? (
                      <span className="font-mono">{groupKey}</span>
                    ) : groupBy === 'severity' ? (
                      <span className="capitalize">{groupKey} Issues</span>
                    ) : (
                      groupKey
                    )}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errorCount}
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-warning/20 text-warning hover:bg-warning/20 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {warningCount}
                    </Badge>
                  )}
                  {groupBy === 'template' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/roi/${(groupKey as RoiTemplateId).toLowerCase().replace('.', '_')}`}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {groupErrors.map((error, index) => (
                    <ErrorItem key={index} error={error} showTemplate={groupBy !== 'template'} />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

interface ErrorItemProps {
  error: ValidationError;
  showTemplate?: boolean;
}

function ErrorItem({ error, showTemplate = false }: ErrorItemProps) {
  const SeverityIcon = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[error.severity];

  const severityColors = {
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  };

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-muted/30">
      <SeverityIcon className={cn('h-4 w-4 mt-0.5', severityColors[error.severity])} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {showTemplate && (
            <Badge variant="outline" className="font-mono text-xs">
              {error.templateId}
            </Badge>
          )}
          <Badge variant="secondary" className="font-mono text-xs">
            {error.columnCode}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Row {error.rowIndex + 1}
          </span>
        </div>
        <p className="text-sm">{error.message}</p>
        {error.suggestion && (
          <p className="text-xs text-muted-foreground mt-1">
            Suggestion: {error.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}
