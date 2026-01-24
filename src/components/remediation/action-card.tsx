'use client';

/**
 * Action Card Component
 *
 * Displays a remediation action in card format with status and controls.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import {
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Play,
  RotateCcw,
  Eye,
  FileCheck,
  AlertOctagon,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import type { RemediationActionWithRelations, ActionStatus } from '@/lib/remediation/types';
import { ACTION_STATUS_INFO, PRIORITY_INFO, ACTION_TYPE_INFO } from '@/lib/remediation/types';
import { updateActionStatus, deleteRemediationAction } from '@/lib/remediation/actions';
import { toast } from 'sonner';
import { EvidenceList } from './evidence-list';
import { AddEvidenceDialog } from './add-evidence-dialog';

interface ActionCardProps {
  action: RemediationActionWithRelations;
  onUpdate?: () => void;
  canVerifyEvidence?: boolean;
}

export function ActionCard({ action, onUpdate, canVerifyEvidence = false }: ActionCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBlockedOpen, setIsBlockedOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);

  const statusInfo = ACTION_STATUS_INFO[action.status];
  const priorityInfo = PRIORITY_INFO[action.priority];
  const typeInfo = ACTION_TYPE_INFO[action.action_type];

  const isOverdue =
    action.due_date &&
    isPast(new Date(action.due_date)) &&
    !['completed', 'cancelled'].includes(action.status);

  const handleStatusChange = async (newStatus: ActionStatus, reason?: string) => {
    setIsUpdating(true);
    try {
      const result = await updateActionStatus(action.id, newStatus, reason);
      if (result.success) {
        toast.success(`Action moved to ${ACTION_STATUS_INFO[newStatus].label}`);
        router.refresh();
        onUpdate?.();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } finally {
      setIsUpdating(false);
      setIsBlockedOpen(false);
      setBlockedReason('');
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const result = await deleteRemediationAction(action.id);
      if (result.success) {
        toast.success('Action deleted');
        router.refresh();
        onUpdate?.();
      } else {
        toast.error(result.error || 'Failed to delete action');
      }
    } finally {
      setIsUpdating(false);
      setIsDeleteOpen(false);
    }
  };

  const getNextStatus = (): ActionStatus | null => {
    switch (action.status) {
      case 'backlog':
        return 'todo';
      case 'todo':
        return 'in_progress';
      case 'in_progress':
        return 'in_review';
      case 'in_review':
        return 'completed';
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className={cn(action.status === 'blocked' && 'border-error/50')}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Expand trigger */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {action.action_ref}
                      </span>
                      <Badge variant="outline" className={cn('text-xs', statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {typeInfo.label}
                      </Badge>
                    </div>
                    <h4 className="font-medium leading-tight">{action.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn('text-xs', priorityInfo.color)}>
                      {priorityInfo.label}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {action.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {action.assignee.full_name}
                    </span>
                  )}
                  {action.due_date && (
                    <span
                      className={cn('flex items-center gap-1', isOverdue && 'text-error')}
                    >
                      <Calendar className="h-3 w-3" />
                      Due {format(new Date(action.due_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  {action.requires_evidence && (
                    <span className="flex items-center gap-1">
                      <FileCheck className="h-3 w-3" />
                      Evidence required
                    </span>
                  )}
                </div>

                {/* Blocked reason */}
                {action.status === 'blocked' && action.blocked_reason && (
                  <div className="flex items-start gap-2 text-xs text-error bg-error/10 rounded-md p-2">
                    <AlertOctagon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{action.blocked_reason}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {nextStatus && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(nextStatus)}
                    disabled={isUpdating}
                  >
                    {nextStatus === 'todo' && 'Start'}
                    {nextStatus === 'in_progress' && 'Begin'}
                    {nextStatus === 'in_review' && 'Review'}
                    {nextStatus === 'completed' && (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Complete
                      </>
                    )}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {action.status !== 'blocked' && action.status !== 'completed' && (
                      <DropdownMenuItem onClick={() => setIsBlockedOpen(true)}>
                        <AlertOctagon className="h-4 w-4 mr-2" />
                        Mark Blocked
                      </DropdownMenuItem>
                    )}
                    {action.status === 'blocked' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Unblock
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-error focus:text-error"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Expanded content */}
            <CollapsibleContent>
              <div className="mt-4 pt-4 border-t space-y-4">
                {action.description && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Description
                    </h5>
                    <p className="text-sm">{action.description}</p>
                  </div>
                )}
                {action.requirement_reference && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Requirement Reference
                    </h5>
                    <p className="text-sm font-mono">{action.requirement_reference}</p>
                  </div>
                )}
                {action.requires_evidence && action.evidence_description && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Required Evidence
                    </h5>
                    <p className="text-sm">{action.evidence_description}</p>
                  </div>
                )}

                {/* Evidence Section */}
                {action.requires_evidence && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        Evidence
                        {action.evidence && action.evidence.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {action.evidence.length}
                          </Badge>
                        )}
                      </h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddEvidenceOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Evidence
                      </Button>
                    </div>
                    <EvidenceList
                      evidence={action.evidence || []}
                      actionId={action.id}
                      canVerify={canVerifyEvidence}
                      onEvidenceChange={() => {
                        router.refresh();
                        onUpdate?.();
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {action.estimated_hours && (
                    <span>Estimated: {action.estimated_hours}h</span>
                  )}
                  {action.actual_hours && <span>Actual: {action.actual_hours}h</span>}
                  <span>
                    Created{' '}
                    {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this action? This cannot be undone.
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

      {/* Block Dialog */}
      <AlertDialog open={isBlockedOpen} onOpenChange={setIsBlockedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Blocked</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for blocking this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter the blocking reason..."
            value={blockedReason}
            onChange={(e) => setBlockedReason(e.target.value)}
            className="mt-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange('blocked', blockedReason)}
              disabled={isUpdating || !blockedReason.trim()}
            >
              {isUpdating ? 'Updating...' : 'Mark Blocked'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Evidence Dialog */}
      <AddEvidenceDialog
        open={isAddEvidenceOpen}
        onOpenChange={setIsAddEvidenceOpen}
        actionId={action.id}
        onSuccess={() => {
          router.refresh();
          onUpdate?.();
        }}
      />
    </>
  );
}
