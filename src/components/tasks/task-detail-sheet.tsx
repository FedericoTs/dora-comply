'use client';

/**
 * Task Detail Sheet Component
 *
 * Side sheet for viewing and editing task details.
 */

import { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Building2,
  AlertTriangle,
  MessageSquare,
  Loader2,
  Trash2,
  Send,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { updateTask, deleteTask, addTaskComment, fetchTaskComments } from '@/lib/tasks/actions';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_TYPE_LABELS,
  type TaskWithRelations,
  type TaskCommentWithAuthor,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from '@/lib/tasks/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface TaskDetailSheetProps {
  task: TaskWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: (task: TaskWithRelations) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailSheetProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [comments, setComments] = useState<TaskCommentWithAuthor[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [taskType, setTaskType] = useState<TaskType>('general');
  const [dueDate, setDueDate] = useState('');

  // Load task data when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setTaskType(task.task_type);
      setDueDate(task.due_date || '');
    }
  }, [task]);

  // Load comments when sheet opens
  useEffect(() => {
    if (open && task) {
      setIsLoadingComments(true);
      fetchTaskComments(task.id)
        .then(setComments)
        .catch(console.error)
        .finally(() => setIsLoadingComments(false));
    }
  }, [open, task]);

  if (!task) return null;

  const isOverdue =
    task.due_date &&
    isPast(parseISO(task.due_date)) &&
    !['completed', 'cancelled'].includes(task.status);

  const handleUpdate = async (field: string, value: string | null) => {
    setIsUpdating(true);
    try {
      const result = await updateTask(task.id, { [field]: value });
      if (result.success && result.data) {
        onTaskUpdated?.(result.data as TaskWithRelations);
        toast.success('Task updated');
      } else {
        toast.error(result.error || 'Failed to update task');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast.success('Task deleted');
        onTaskDeleted?.(task.id);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to delete task');
      }
    } finally {
      setIsUpdating(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const result = await addTaskComment(task.id, newComment.trim());
      if (result.success && result.data) {
        setComments((prev) => [...prev, result.data as TaskCommentWithAuthor]);
        setNewComment('');
        toast.success('Comment added');
      } else {
        toast.error(result.error || 'Failed to add comment');
      }
    } finally {
      setIsAddingComment(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-start gap-2">
              {isOverdue && (
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{task.title}</span>
            </SheetTitle>
            <SheetDescription>
              Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as TaskStatus);
                    handleUpdate('status', value);
                  }}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        <Badge className={TASK_STATUS_COLORS[s]}>
                          {TASK_STATUS_LABELS[s]}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => {
                    setPriority(value as TaskPriority);
                    handleUpdate('priority', value);
                  }}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        <Badge className={TASK_PRIORITY_COLORS[p]}>
                          {TASK_PRIORITY_LABELS[p]}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select
                value={taskType}
                onValueChange={(value) => {
                  setTaskType(value as TaskType);
                  handleUpdate('task_type', value);
                }}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TASK_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleUpdate('due_date', e.target.value || null);
                }}
                disabled={isUpdating}
              />
              {isOverdue && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  This task is overdue
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleUpdate('description', description || null)}
                placeholder="Add a description..."
                rows={4}
                disabled={isUpdating}
              />
            </div>

            {/* Linked Entities */}
            {(task.vendor || task.incident) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Linked To
                  </Label>

                  {task.vendor && (
                    <Link
                      href={`/vendors/${task.vendor.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{task.vendor.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                    </Link>
                  )}

                  {task.incident && (
                    <Link
                      href={`/incidents/${task.incident.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{task.incident.title}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                    </Link>
                  )}
                </div>
              </>
            )}

            {/* Comments */}
            <Separator />
            <div className="space-y-4">
              <Label className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </Label>

              {/* Comment list */}
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {comment.author?.full_name || comment.author?.email || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet
                </p>
              )}

              {/* Add comment */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  disabled={isAddingComment}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={isAddingComment || !newComment.trim()}
                >
                  {isAddingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Delete button */}
            <Separator />
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isUpdating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
