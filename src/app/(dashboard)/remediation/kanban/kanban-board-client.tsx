'use client';

/**
 * Kanban Board Client Component
 *
 * Interactive Kanban board for remediation actions with drag-and-drop.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  GripVertical,
  MoreHorizontal,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import type {
  KanbanData,
  RemediationPlanWithRelations,
  RemediationActionWithRelations,
  ActionStatus,
} from '@/lib/remediation/types';
import { PRIORITY_INFO, ACTION_STATUS_INFO } from '@/lib/remediation/types';
import { updateActionStatus } from '@/lib/remediation/actions';
import { toast } from 'sonner';

interface KanbanBoardClientProps {
  initialData: KanbanData;
  plans: RemediationPlanWithRelations[];
  selectedPlanId?: string;
}

export function KanbanBoardClient({
  initialData,
  plans,
  selectedPlanId,
}: KanbanBoardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [kanbanData, setKanbanData] = useState(initialData);
  const [draggingAction, setDraggingAction] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePlanChange = (planId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (planId === 'all') {
      params.delete('planId');
    } else {
      params.set('planId', planId);
    }
    router.push(`/remediation/kanban?${params.toString()}`);
  };

  const handleDragStart = (e: React.DragEvent, actionId: string) => {
    setDraggingAction(actionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', actionId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ActionStatus) => {
    e.preventDefault();
    const actionId = e.dataTransfer.getData('text/plain');
    setDraggingAction(null);

    if (!actionId) return;

    // Find the action and its current status
    let currentAction: RemediationActionWithRelations | null = null;
    for (const column of kanbanData.columns) {
      const found = column.actions.find(a => a.id === actionId);
      if (found) {
        currentAction = found;
        break;
      }
    }

    // Also check blocked actions
    if (!currentAction) {
      currentAction = kanbanData.blockedActions.find(a => a.id === actionId) || null;
    }

    if (!currentAction || currentAction.status === newStatus) return;

    // Optimistic update
    setKanbanData(prev => {
      const newColumns = prev.columns.map(col => ({
        ...col,
        actions: col.actions.filter(a => a.id !== actionId),
      }));

      // Add to new column
      const targetColumnIndex = newColumns.findIndex(col => col.id === newStatus);
      if (targetColumnIndex !== -1) {
        newColumns[targetColumnIndex] = {
          ...newColumns[targetColumnIndex],
          actions: [
            ...newColumns[targetColumnIndex].actions,
            { ...currentAction!, status: newStatus },
          ],
        };
      }

      return {
        columns: newColumns,
        blockedActions: prev.blockedActions.filter(a => a.id !== actionId),
      };
    });

    // Update on server
    setIsUpdating(true);
    try {
      const result = await updateActionStatus(actionId, newStatus);
      if (result.success) {
        toast.success(`Action moved to ${ACTION_STATUS_INFO[newStatus].label}`);
      } else {
        // Revert on error
        router.refresh();
        toast.error(result.error || 'Failed to update status');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragEnd = () => {
    setDraggingAction(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/remediation">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Kanban Board</h1>
            <p className="text-muted-foreground text-sm">
              Drag and drop actions between columns to update their status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPlanId || 'all'} onValueChange={handlePlanChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.plan_ref} - {plan.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Blocked Actions */}
      {kanbanData.blockedActions.length > 0 && (
        <Card className="mb-6 border-error/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-error">
              <AlertTriangle className="h-4 w-4" />
              Blocked Actions ({kanbanData.blockedActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {kanbanData.blockedActions.map(action => (
                <KanbanCard
                  key={action.id}
                  action={action}
                  isDragging={draggingAction === action.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  compact
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="flex gap-4 pb-4 min-w-max">
          {kanbanData.columns.map(column => (
            <div
              key={column.id}
              className={cn(
                'flex flex-col w-72 rounded-lg bg-muted/50',
                draggingAction && 'ring-2 ring-dashed ring-muted-foreground/30'
              )}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{column.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {column.actions.length}
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                {column.actions.map(action => (
                  <KanbanCard
                    key={action.id}
                    action={action}
                    isDragging={draggingAction === action.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

interface KanbanCardProps {
  action: RemediationActionWithRelations;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, actionId: string) => void;
  onDragEnd: () => void;
  compact?: boolean;
}

function KanbanCard({
  action,
  isDragging,
  onDragStart,
  onDragEnd,
  compact = false,
}: KanbanCardProps) {
  const priorityInfo = PRIORITY_INFO[action.priority];
  const isOverdue =
    action.due_date &&
    isPast(new Date(action.due_date)) &&
    !['completed', 'cancelled'].includes(action.status);

  return (
    <Card
      draggable
      onDragStart={e => onDragStart(e, action.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-50 ring-2 ring-primary',
        compact && 'w-64',
        isOverdue && 'border-error/50'
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                {action.action_ref}
              </span>
              <Badge className={cn('text-xs h-5', priorityInfo.color)}>
                {action.priority[0].toUpperCase()}
              </Badge>
            </div>
            <h4 className="text-sm font-medium leading-tight line-clamp-2">
              {action.title}
            </h4>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {action.assignee && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {action.assignee.full_name.split(' ')[0]}
            </span>
          )}
          {action.due_date && (
            <span
              className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-error font-medium'
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(action.due_date), 'MMM d')}
            </span>
          )}
        </div>

        {/* Plan info */}
        {action.plan && (
          <Link
            href={`/remediation/${action.plan.id}`}
            className="text-xs text-muted-foreground hover:text-foreground truncate block"
            onClick={e => e.stopPropagation()}
          >
            {action.plan.plan_ref}
          </Link>
        )}

        {/* Blocked reason */}
        {action.status === 'blocked' && action.blocked_reason && (
          <div className="text-xs text-error bg-error/10 rounded p-1.5 line-clamp-2">
            {action.blocked_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
