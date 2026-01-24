'use client';

/**
 * Plan Detail Client Component
 *
 * Client-side UI for viewing and managing a single remediation plan.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Pause,
  Check,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type {
  RemediationPlanWithRelations,
  RemediationActionWithRelations,
  PlanStatus,
} from '@/lib/remediation/types';
import {
  PLAN_STATUS_INFO,
  PRIORITY_INFO,
  SOURCE_TYPE_INFO,
} from '@/lib/remediation/types';
import { updatePlanStatus, deleteRemediationPlan } from '@/lib/remediation/actions';
import { ActionCard } from '@/components/remediation/action-card';
import { CreateActionDialog } from '@/components/remediation/create-action-dialog';
import { ProgressReportCard } from '@/components/remediation/progress-report-card';
import { ExportProgressButton } from '@/components/remediation/export-progress-button';
import { toast } from 'sonner';

interface PlanDetailClientProps {
  plan: RemediationPlanWithRelations;
  initialActions: RemediationActionWithRelations[];
}

export function PlanDetailClient({ plan, initialActions }: PlanDetailClientProps) {
  const router = useRouter();
  const [actions] = useState(initialActions);
  const [isCreateActionOpen, setIsCreateActionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusInfo = PLAN_STATUS_INFO[plan.status];
  const priorityInfo = PRIORITY_INFO[plan.priority];
  const sourceInfo = SOURCE_TYPE_INFO[plan.source_type];

  const isOverdue =
    plan.target_date &&
    isPast(new Date(plan.target_date)) &&
    !['completed', 'cancelled'].includes(plan.status);

  const handleStatusChange = async (newStatus: PlanStatus) => {
    setIsUpdating(true);
    try {
      const result = await updatePlanStatus(plan.id, newStatus);
      if (result.success) {
        toast.success(`Plan status updated to ${PLAN_STATUS_INFO[newStatus].label}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const result = await deleteRemediationPlan(plan.id);
      if (result.success) {
        toast.success('Plan deleted');
        router.push('/remediation');
      } else {
        toast.error(result.error || 'Failed to delete plan');
      }
    } finally {
      setIsUpdating(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/remediation">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-mono text-muted-foreground">{plan.plan_ref}</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(statusInfo.color)}>
                {statusInfo.label}
              </Badge>
              <Badge className={cn(priorityInfo.color)}>{priorityInfo.label}</Badge>
              {plan.framework && (
                <Badge variant="secondary" className="uppercase">
                  {plan.framework}
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{plan.title}</h1>
            {plan.description && (
              <p className="text-muted-foreground max-w-2xl">{plan.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {plan.status === 'draft' && (
              <Button onClick={() => handleStatusChange('pending_approval')} disabled={isUpdating}>
                Submit for Approval
              </Button>
            )}
            {plan.status === 'pending_approval' && (
              <Button onClick={() => handleStatusChange('approved')} disabled={isUpdating}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {plan.status === 'approved' && (
              <Button onClick={() => handleStatusChange('in_progress')} disabled={isUpdating}>
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            )}
            {plan.status === 'in_progress' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('on_hold')}
                  disabled={isUpdating}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button onClick={() => handleStatusChange('completed')} disabled={isUpdating}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              </>
            )}
            {plan.status === 'on_hold' && (
              <Button onClick={() => handleStatusChange('in_progress')} disabled={isUpdating}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/remediation/${plan.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Plan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {plan.status !== 'cancelled' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Plan
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-error focus:text-error"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              Source: <span className="text-foreground">{sourceInfo.label}</span>
            </span>
            {plan.vendor && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {plan.vendor.name}
              </span>
            )}
            {plan.owner && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                {plan.owner.full_name}
              </span>
            )}
            {plan.target_date && (
              <span
                className={cn('flex items-center gap-1.5', isOverdue && 'text-error')}
              >
                <Calendar className="h-4 w-4" />
                Target: {format(new Date(plan.target_date), 'MMM d, yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Created {formatDistanceToNow(new Date(plan.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Progress Report */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <ProgressReportCard plan={plan} actions={actions} />
        </div>
        <div className="shrink-0">
          <ExportProgressButton plan={plan} actions={actions} />
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actions</h2>
          <Button onClick={() => setIsCreateActionOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Action
          </Button>
        </div>

        {actions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No actions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add actions to track the steps needed to complete this remediation plan.
              </p>
              <Button onClick={() => setIsCreateActionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Action
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateActionDialog
        open={isCreateActionOpen}
        onOpenChange={setIsCreateActionOpen}
        planId={plan.id}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Remediation Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plan? This action cannot be undone.
              All associated actions will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isUpdating}
              className="bg-error hover:bg-error/90"
            >
              {isUpdating ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
