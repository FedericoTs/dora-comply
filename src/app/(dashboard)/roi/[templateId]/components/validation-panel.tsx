'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { useState } from 'react';
import type { ValidationError } from '@/lib/roi/types';

interface ValidationPanelProps {
  errors: ValidationError[];
  isValid: boolean;
}

export function ValidationPanel({ errors, isValid }: ValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!isValid);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const infoCount = errors.filter(e => e.severity === 'info').length;

  if (isValid && errors.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-green-800 dark:text-green-200">Validation Passed</CardTitle>
          </div>
          <CardDescription className="text-green-700 dark:text-green-300">
            All records meet ESA requirements and are ready for export
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'border-2',
      errorCount > 0
        ? 'border-red-200 dark:border-red-800'
        : 'border-yellow-200 dark:border-yellow-800'
    )}>
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {errorCount > 0 ? (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            )}
            <CardTitle className={errorCount > 0
              ? 'text-red-800 dark:text-red-200'
              : 'text-yellow-800 dark:text-yellow-200'
            }>
              Validation Issues Found
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <Badge variant="destructive">{errorCount} errors</Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-900">
                {warningCount} warnings
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="secondary">{infoCount} info</Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
        <CardDescription>
          {errorCount > 0
            ? 'Fix errors before submitting to ESA'
            : 'Review warnings to improve data quality'}
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {errors.map((error, index) => (
              <ValidationErrorCard key={index} error={error} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface ValidationErrorCardProps {
  error: ValidationError;
}

function ValidationErrorCard({ error }: ValidationErrorCardProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);

  const SeverityIcon = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[error.severity];

  const severityColors = {
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
  };

  const iconColors = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={cn('rounded-lg border p-3', severityColors[error.severity])}>
      <div className="flex items-start gap-3">
        <SeverityIcon className={cn('h-4 w-4 mt-0.5', iconColors[error.severity])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-background/50">
              {error.columnCode}
            </span>
            {error.rowIndex !== undefined && (
              <span className="text-xs text-muted-foreground">
                Row {error.rowIndex + 1}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{error.message}</p>

          {error.suggestion && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-xs"
                onClick={() => setShowSuggestion(!showSuggestion)}
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                {showSuggestion ? 'Hide suggestion' : 'Show AI suggestion'}
              </Button>

              {showSuggestion && (
                <div className="mt-2 p-2 rounded bg-background/80 border text-sm">
                  <p className="text-muted-foreground">{error.suggestion}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
