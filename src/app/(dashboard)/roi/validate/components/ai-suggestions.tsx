'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import type { ValidationError } from '@/lib/roi/types';

interface AiSuggestionsProps {
  errors: ValidationError[];
}

interface SuggestionGroup {
  category: string;
  description: string;
  errors: ValidationError[];
  autoFixable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export function AiSuggestions({ errors }: AiSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Group errors by pattern for smart suggestions
  const suggestionGroups = categorizeSuggestions(errors);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (errors.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-medium">No Issues Detected</p>
              <p className="text-sm text-green-700">Your RoI data passes all ESA validation rules.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI-Powered Suggestions</CardTitle>
          </div>
          <CardDescription>
            Smart recommendations to fix validation issues quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestionGroups.map((group, index) => (
              <SuggestionCard
                key={index}
                group={group}
                index={index}
                copiedIndex={copiedIndex}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {errors.filter((e) => e.severity === 'error').length}
              </p>
              <p className="text-xs text-muted-foreground">Must Fix</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {errors.filter((e) => e.severity === 'warning').length}
              </p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {suggestionGroups.filter((g) => g.autoFixable).length}
              </p>
              <p className="text-xs text-muted-foreground">Auto-Fixable</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  group: SuggestionGroup;
  index: number;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
}

function SuggestionCard({ group, index, copiedIndex, onCopy }: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityColors = {
    high: 'border-red-200 bg-red-50/50',
    medium: 'border-yellow-200 bg-yellow-50/50',
    low: 'border-blue-200 bg-blue-50/50',
  };

  const priorityBadgeColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  // Generate fix suggestion text
  const fixSuggestion = generateFixSuggestion(group);

  return (
    <div className={cn('rounded-lg border p-4', priorityColors[group.priority])}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">{group.category}</span>
            <Badge className={cn('text-xs', priorityBadgeColors[group.priority])}>
              {group.priority} priority
            </Badge>
            {group.autoFixable && (
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Auto-fixable
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{group.description}</p>
          <p className="text-xs text-muted-foreground">
            Affects {group.errors.length} record{group.errors.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {fixSuggestion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(fixSuggestion, index)}
            >
              {copiedIndex === index ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Fix
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <p className="text-sm font-medium">Affected Records:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {group.errors.slice(0, 10).map((error, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="font-mono">
                  {error.templateId}
                </Badge>
                <span>Row {error.rowIndex + 1}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{error.message}</span>
              </div>
            ))}
            {group.errors.length > 10 && (
              <p className="text-xs text-muted-foreground">
                ...and {group.errors.length - 10} more
              </p>
            )}
          </div>

          {fixSuggestion && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Suggested Fix:</p>
              <div className="bg-background rounded p-3 font-mono text-xs overflow-x-auto">
                {fixSuggestion}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function categorizeSuggestions(errors: ValidationError[]): SuggestionGroup[] {
  const groups: SuggestionGroup[] = [];

  // Group by common patterns
  const missingRequired = errors.filter((e) => e.rule === 'required');
  const invalidFormat = errors.filter((e) => e.rule === 'format' || e.rule === 'pattern');
  const invalidDates = errors.filter((e) => e.rule === 'date_range' || e.rule === 'date_order');
  const invalidEnums = errors.filter((e) => e.rule === 'enum');
  const duplicates = errors.filter((e) => e.rule === 'unique');

  if (missingRequired.length > 0) {
    groups.push({
      category: 'Missing Required Fields',
      description: 'These fields are mandatory for ESA submission and must be filled in.',
      errors: missingRequired,
      autoFixable: false,
      priority: 'high',
    });
  }

  if (invalidFormat.length > 0) {
    groups.push({
      category: 'Invalid Format',
      description: 'Values do not match the expected ESA format (e.g., LEI codes, dates).',
      errors: invalidFormat,
      autoFixable: true,
      priority: 'high',
    });
  }

  if (invalidDates.length > 0) {
    groups.push({
      category: 'Date Validation Issues',
      description: 'Date values are out of range or in wrong order (e.g., end date before start).',
      errors: invalidDates,
      autoFixable: false,
      priority: 'medium',
    });
  }

  if (invalidEnums.length > 0) {
    groups.push({
      category: 'Invalid Enumeration Values',
      description: 'Values must use ESA-defined codes (e.g., country codes, service types).',
      errors: invalidEnums,
      autoFixable: true,
      priority: 'medium',
    });
  }

  if (duplicates.length > 0) {
    groups.push({
      category: 'Duplicate Records',
      description: 'Records with duplicate identifiers that should be unique.',
      errors: duplicates,
      autoFixable: false,
      priority: 'high',
    });
  }

  // Remaining errors
  const categorized = new Set([
    ...missingRequired,
    ...invalidFormat,
    ...invalidDates,
    ...invalidEnums,
    ...duplicates,
  ]);
  const other = errors.filter((e) => !categorized.has(e));

  if (other.length > 0) {
    groups.push({
      category: 'Other Issues',
      description: 'Additional validation issues that need review.',
      errors: other,
      autoFixable: false,
      priority: 'low',
    });
  }

  return groups;
}

function generateFixSuggestion(group: SuggestionGroup): string | null {
  switch (group.category) {
    case 'Invalid Format':
      return `-- For LEI codes, ensure format: 20 alphanumeric characters
-- For dates, use YYYY-MM-DD format
-- Example: UPDATE vendors SET lei = '5493001KJTIIGC8Y1R12' WHERE id = ...`;

    case 'Invalid Enumeration Values':
      return `-- Use ESA enumeration codes:
-- Countries: eba_GA:DE, eba_GA:FR, eba_GA:ES, etc.
-- Entity types: eba_CT:x1 (credit institution), eba_CT:x2 (investment firm), etc.`;

    case 'Missing Required Fields':
      return `-- Review required fields and ensure all are populated
-- Check vendor/contract records for missing data`;

    default:
      return null;
  }
}
