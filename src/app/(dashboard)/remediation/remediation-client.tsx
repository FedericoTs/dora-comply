'use client';

/**
 * Remediation Client Component
 *
 * Unified client-side UI for the remediation dashboard with:
 * - Plans list view
 * - Kanban board view
 * - My Actions view
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  LayoutGrid,
  List,
  Wand2,
  GripVertical,
  Calendar,
  User,
  Kanban,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import { toast } from 'sonner';
import type {
  RemediationPlanWithRelations,
  RemediationStats,
  RemediationActionWithRelations,
  KanbanData,
  PlanStatus,
  Priority,
  ActionStatus,
} from '@/lib/remediation/types';
import { PRIORITY_INFO, ACTION_STATUS_INFO } from '@/lib/remediation/types';
import { updateActionStatus } from '@/lib/remediation/actions';
import { PlanCard } from '@/components/remediation/plan-card';
import { ActionCard } from '@/components/remediation/action-card';

interface RemediationClientProps {
  initialPlans: RemediationPlanWithRelations[];
  initialTotal: number;
  initialStats: RemediationStats;
  initialKanbanData: KanbanData;
  initialMyActions: RemediationActionWithRelations[];
}

export function RemediationClient({
  initialPlans,
  initialTotal,
  initialStats,
  initialKanbanData,
  initialMyActions,
}: RemediationClientProps) {
  const router = useRouter();
  const [plans] = useState(initialPlans);
  const [stats] = useState(initialStats);
  const [kanbanData, setKanbanData] = useState(initialKanbanData);
  const [myActions] = useState(initialMyActions);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [draggingAction, setDraggingAction] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    const matchesSearch =
      !searchQuery ||
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.plan_ref.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || plan.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Kanban drag handlers
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

    let currentAction: RemediationActionWithRelations | null = null;
    for (const column of kanbanData.columns) {
      const found = column.actions.find(a => a.id === actionId);
      if (found) {
        currentAction = found;
        break;
      }
    }

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

    setIsUpdating(true);
    try {
      const result = await updateActionStatus(actionId, newStatus);
      if (result.success) {
        toast.success(`Action moved to ${ACTION_STATUS_INFO[newStatus].label}`);
      } else {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Remediation</h1>
          <p className="text-muted-foreground">
            Track and manage remediation plans to close compliance gaps
          </p>
        </div>
        <Button asChild>
          <Link href="/remediation/new">
            <Wand2 className="h-4 w-4 mr-2" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPlans}</p>
                <p className="text-sm text-muted-foreground">Total Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activePlans}</p>
                <p className="text-sm text-muted-foreground">Active Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedPlans}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error/10">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overduePlans}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Action Progress</CardTitle>
          <CardDescription>
            {stats.completedActions} of {stats.totalActions} actions completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={
              stats.totalActions > 0
                ? (stats.completedActions / stats.totalActions) * 100
                : 0
            }
            className="h-2"
          />
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-muted-foreground">
                  {stats.completedActions} Completed
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-error" />
                <span className="text-muted-foreground">
                  {stats.overdueActions} Overdue
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-muted-foreground">
                  {stats.blockedActions} Blocked
                </span>
              </span>
            </div>
            <span className="font-medium">
              {stats.avgProgress.toFixed(0)}% avg progress
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="my-actions" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            My Actions
            {myActions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {myActions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search plans..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
              <Select
                value={statusFilter}
                onValueChange={v => setStatusFilter(v as PlanStatus | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={v => setPriorityFilter(v as Priority | 'all')}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-1">No remediation plans</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No plans match your filters'
                    : 'Create your first remediation plan to track gap closures'}
                </p>
                {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
                  <Button asChild>
                    <Link href="/remediation/new">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Create Plan
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} compact />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Kanban Tab */}
        <TabsContent value="kanban" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag and drop actions between columns to update their status
          </p>

          {/* Blocked Actions */}
          {kanbanData.blockedActions.length > 0 && (
            <Card className="border-error/50">
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
          <ScrollArea className="-mx-2 px-2">
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
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{column.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {column.actions.length}
                      </Badge>
                    </div>
                  </div>
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
        </TabsContent>

        {/* My Actions Tab */}
        <TabsContent value="my-actions" className="space-y-4">
          {myActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-1">No actions assigned</h3>
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any remediation actions assigned to you yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myActions.map(action => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Priority Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Low Priority</span>
              <Badge variant="outline">{stats.byPriority.low}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Medium Priority</span>
              <Badge variant="outline">{stats.byPriority.medium}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">High Priority</span>
              <Badge variant="outline">{stats.byPriority.high}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Critical</span>
              <Badge variant="outline">{stats.byPriority.critical}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Kanban Card Component
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

        {action.plan && (
          <Link
            href={`/remediation/${action.plan.id}`}
            className="text-xs text-muted-foreground hover:text-foreground truncate block"
            onClick={e => e.stopPropagation()}
          >
            {action.plan.plan_ref}
          </Link>
        )}

        {action.status === 'blocked' && action.blocked_reason && (
          <div className="text-xs text-error bg-error/10 rounded p-1.5 line-clamp-2">
            {action.blocked_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
