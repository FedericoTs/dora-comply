'use client';

/**
 * Task Card Component
 *
 * Displays a single task in a card format.
 */

import { useState } from 'react';
import {
  Calendar,
  User,
  Building2,
  AlertTriangle,
  MessageSquare,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateTask, deleteTask } from '@/lib/tasks/actions';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_TYPE_LABELS,
  type TaskWithRelations,
} from '@/lib/tasks/types';
import { toast } from 'sonner';

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
  onUpdated?: (task: TaskWithRelations) => void;
  onDeleted?: (taskId: string) => void;
}

export function TaskCard({ task, onClick, onUpdated, onDeleted }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const isOverdue =
    task.due_date &&
    isPast(parseISO(task.due_date)) &&
    !['completed', 'cancelled'].includes(task.status);

  const handleMarkComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const result = await updateTask(task.id, { status: 'completed' });
      if (result.success && result.data) {
        toast.success('Task completed');
        onUpdated?.(result.data as TaskWithRelations);
      } else {
        toast.error(result.error || 'Failed to update task');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsUpdating(true);
    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast.success('Task deleted');
        onDeleted?.(task.id);
      } else {
        toast.error(result.error || 'Failed to delete task');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      className={`card-elevated cursor-pointer transition-all hover:shadow-md ${
        isOverdue ? 'border-red-200 dark:border-red-900/50' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Title and badges */}
            <div className="flex items-start gap-2 mb-2">
              <h3 className="font-medium text-sm truncate flex-1">{task.title}</h3>
              <Badge className={TASK_PRIORITY_COLORS[task.priority]}>
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
              <Badge className={TASK_STATUS_COLORS[task.status]}>
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
            </div>

            {/* Description preview */}
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {task.description}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {/* Task type */}
              <span className="inline-flex items-center gap-1">
                {TASK_TYPE_LABELS[task.task_type]}
              </span>

              {/* Due date */}
              {task.due_date && (
                <span
                  className={`inline-flex items-center gap-1 ${
                    isOverdue ? 'text-red-600 dark:text-red-400' : ''
                  }`}
                >
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(task.due_date), 'MMM d, yyyy')}
                </span>
              )}

              {/* Assignee */}
              {task.assignee && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assignee.full_name || task.assignee.email}
                </span>
              )}

              {/* Linked vendor */}
              {task.vendor && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {task.vendor.name}
                </span>
              )}

              {/* Comment count */}
              {task.comment_count !== undefined && task.comment_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {task.comment_count}
                </span>
              )}

              {/* Created */}
              <span>
                {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {task.status !== 'completed' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMarkComplete}
                disabled={isUpdating}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onClick}>View Details</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
