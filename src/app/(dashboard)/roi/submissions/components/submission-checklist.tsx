'use client';

/**
 * Submission Checklist Component
 *
 * Interactive checklist for submission readiness with progress tracking
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
  Settings,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { SubmissionChecklist, ChecklistItem } from '@/lib/roi/submissions-types';

interface SubmissionChecklistProps {
  checklist: SubmissionChecklist;
  onItemClick?: (item: ChecklistItem) => void;
  onMarkComplete?: (itemId: string) => void;
  className?: string;
}

const categoryConfig: Record<ChecklistItem['category'], {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  data: {
    label: 'Data Completeness',
    icon: FileSpreadsheet,
    color: 'text-blue-600',
  },
  validation: {
    label: 'Validation',
    icon: ShieldCheck,
    color: 'text-purple-600',
  },
  approval: {
    label: 'Approvals',
    icon: UserCheck,
    color: 'text-amber-600',
  },
  technical: {
    label: 'Technical',
    icon: Settings,
    color: 'text-green-600',
  },
};

export function SubmissionChecklistCard({
  checklist,
  onItemClick,
  onMarkComplete,
  className,
}: SubmissionChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['data', 'validation'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Group items by category
  const itemsByCategory = checklist.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const progressPercent = Math.round(
    (checklist.completedCount / checklist.totalCount) * 100
  );

  const requiredItems = checklist.items.filter(i => i.isRequired);
  const requiredComplete = requiredItems.filter(i => i.isComplete).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Submission Checklist</CardTitle>
            <CardDescription>
              Complete all required items before submitting
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              checklist.isComplete
                ? 'bg-green-100 text-green-700'
                : 'bg-muted'
            )}
          >
            {checklist.completedCount}/{checklist.totalCount}
          </Badge>
        </div>

        {/* Progress Overview */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Required: {requiredComplete}/{requiredItems.length}
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className={cn(
              'h-2',
              checklist.isComplete && '[&>div]:bg-green-500'
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Categories */}
        {Object.entries(itemsByCategory).map(([category, items]) => {
          const config = categoryConfig[category as ChecklistItem['category']];
          const Icon = config.icon;
          const isExpanded = expandedCategories.has(category);
          const completedInCategory = items.filter(i => i.isComplete).length;
          const hasIncomplete = completedInCategory < items.length;

          return (
            <Collapsible
              key={category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', config.color)} />
                    <span className="font-medium text-sm">{config.label}</span>
                    {hasIncomplete && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {items.length - completedInCategory} remaining
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {completedInCategory}/{items.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pt-2">
                <div className="space-y-1 ml-6">
                  {items.map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      onClick={() => onItemClick?.(item)}
                      onMarkComplete={() => onMarkComplete?.(item.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Ready State */}
        {checklist.isComplete && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-sm text-green-700">
                Ready to Submit
              </p>
              <p className="text-xs text-green-600">
                All required checklist items are complete
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual checklist item row
 */
interface ChecklistItemRowProps {
  item: ChecklistItem;
  onClick?: () => void;
  onMarkComplete?: () => void;
}

function ChecklistItemRow({ item, onClick, onMarkComplete }: ChecklistItemRowProps) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-start gap-3 p-2 rounded-lg transition-colors',
          'hover:bg-muted/50',
          item.isComplete && 'opacity-60'
        )}
      >
        {/* Status Icon */}
        <button
          onClick={onMarkComplete}
          className={cn(
            'shrink-0 mt-0.5',
            !item.isComplete && 'hover:text-green-500'
          )}
        >
          {item.isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'text-sm',
                item.isComplete && 'line-through text-muted-foreground'
              )}
            >
              {item.title}
            </p>
            {item.isRequired && (
              <Badge variant="secondary" className="text-[10px] h-4 bg-red-100 text-red-700">
                Required
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{item.description}</p>

          {/* Error Count */}
          {item.errorCount !== undefined && item.errorCount > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{item.errorCount} validation issues</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {item.templateId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  asChild
                >
                  <Link href={`/roi/${item.templateId}`}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open template {item.templateId}</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClick}
              >
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View details</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact checklist progress indicator
 */
interface ChecklistProgressProps {
  checklist: SubmissionChecklist;
  className?: string;
}

export function ChecklistProgress({ checklist, className }: ChecklistProgressProps) {
  const categories: ChecklistItem['category'][] = ['data', 'validation', 'approval', 'technical'];

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {categories.map((category) => {
        const items = checklist.items.filter(i => i.category === category);
        const complete = items.filter(i => i.isComplete).length;
        const config = categoryConfig[category];
        const Icon = config.icon;

        return (
          <div key={category} className="flex items-center gap-1.5">
            <Icon className={cn('h-3 w-3', config.color)} />
            <span className="text-xs">
              {complete}/{items.length}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Mini checklist for dashboard display
 */
interface MiniChecklistProps {
  checklist: SubmissionChecklist;
  onViewAll?: () => void;
}

export function MiniChecklist({ checklist, onViewAll }: MiniChecklistProps) {
  const incompleteRequired = checklist.items
    .filter(i => i.isRequired && !i.isComplete)
    .slice(0, 3);

  if (incompleteRequired.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium">
          All required items complete
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {incompleteRequired.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
        >
          <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs truncate">{item.title}</span>
        </div>
      ))}

      {checklist.items.filter(i => i.isRequired && !i.isComplete).length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={onViewAll}
        >
          View all{' '}
          {checklist.items.filter(i => i.isRequired && !i.isComplete).length}{' '}
          remaining items
        </Button>
      )}
    </div>
  );
}
