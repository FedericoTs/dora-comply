'use client';

/**
 * Task Stats Component
 *
 * Displays task statistics in a grid of cards.
 */

import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ListTodo,
  Loader2,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TaskStats as TaskStatsType, TaskStatus } from '@/lib/tasks/types';

interface TaskStatsProps {
  stats: TaskStatsType;
  onFilterClick?: (status: TaskStatus | 'all') => void;
}

export function TaskStats({ stats, onFilterClick }: TaskStatsProps) {
  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: ListTodo,
      color: 'text-foreground',
      bgColor: 'bg-muted',
      filter: 'all' as const,
    },
    {
      label: 'Open',
      value: stats.open,
      icon: Circle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      filter: 'open' as TaskStatus,
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: Loader2,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      filter: 'in_progress' as TaskStatus,
    },
    {
      label: 'In Review',
      value: stats.review,
      icon: Eye,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      filter: 'review' as TaskStatus,
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      filter: 'completed' as TaskStatus,
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      filter: 'all' as const, // Special case - can't filter by overdue directly
    },
    {
      label: 'Due This Week',
      value: stats.due_this_week,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      filter: 'all' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const isClickable = onFilterClick && item.filter !== 'all';

        return (
          <Card
            key={item.label}
            className={`card-elevated ${isClickable ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
            onClick={() => isClickable && onFilterClick(item.filter)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
