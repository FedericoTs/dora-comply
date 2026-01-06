/**
 * Priority Action Card
 *
 * Displays a single recommended action with priority indicator
 */

import Link from 'next/link';
import { AlertTriangle, FileText, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { NextAction } from '@/lib/roi/types';

interface PriorityActionCardProps {
  action: NextAction;
}

const priorityConfig = {
  high: {
    badge: 'High Priority',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    iconClass: 'text-red-500',
  },
  medium: {
    badge: 'Medium',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    iconClass: 'text-amber-500',
  },
  low: {
    badge: 'Quick Win',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    iconClass: 'text-emerald-500',
  },
};

const typeConfig = {
  validation_error: {
    icon: AlertTriangle,
    label: 'Fix Errors',
  },
  missing_data: {
    icon: FileText,
    label: 'Add Data',
  },
  review_needed: {
    icon: CheckCircle2,
    label: 'Review',
  },
  quick_win: {
    icon: CheckCircle2,
    label: 'Complete',
  },
  ai_populate: {
    icon: Sparkles,
    label: 'Auto-Fill',
  },
};

export function PriorityActionCard({ action }: PriorityActionCardProps) {
  const priority = priorityConfig[action.priority];
  const type = typeConfig[action.type];
  const Icon = type.icon;

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      action.priority === 'high' && 'border-red-200 dark:border-red-900/50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'rounded-lg p-2 bg-muted/50',
            priority.iconClass
          )}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={cn('text-xs', priority.badgeClass)}>
                {priority.badge}
              </Badge>
              {action.templateId && (
                <Badge variant="outline" className="text-xs">
                  {action.templateId}
                </Badge>
              )}
            </div>

            <h4 className="font-medium text-sm truncate">
              {action.title}
            </h4>

            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {action.description}
            </p>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>~{action.estimatedMinutes} min</span>
              </div>

              <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                <Link href={action.actionUrl}>
                  {type.label}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PriorityActionCardCompact({ action }: PriorityActionCardProps) {
  const priority = priorityConfig[action.priority];
  const type = typeConfig[action.type];
  const Icon = type.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <Icon className={cn('h-4 w-4 shrink-0', priority.iconClass)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{action.title}</p>
        <p className="text-xs text-muted-foreground truncate">{action.description}</p>
      </div>

      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" asChild>
        <Link href={action.actionUrl}>
          {type.label}
        </Link>
      </Button>
    </div>
  );
}
