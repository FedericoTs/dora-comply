'use client';

/**
 * Task Filters Component
 *
 * Filter controls for the task list.
 */

import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/tasks/types';

interface TaskFiltersProps {
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  showMyTasks: boolean;
  onStatusChange: (status: TaskStatus | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  onMyTasksChange: (show: boolean) => void;
}

export function TaskFilters({
  statusFilter,
  priorityFilter,
  showMyTasks,
  onStatusChange,
  onPriorityChange,
  onMyTasksChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status Filter */}
      <Select
        value={statusFilter}
        onValueChange={(value) => onStatusChange(value as TaskStatus | 'all')}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={priorityFilter}
        onValueChange={(value) => onPriorityChange(value as TaskPriority | 'all')}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
            <SelectItem key={priority} value={priority}>
              {TASK_PRIORITY_LABELS[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* My Tasks Toggle */}
      <Button
        variant={showMyTasks ? 'default' : 'outline'}
        size="sm"
        onClick={() => onMyTasksChange(!showMyTasks)}
      >
        <User className="h-4 w-4 mr-2" />
        My Tasks
      </Button>

      {/* Clear Filters */}
      {(statusFilter !== 'all' || priorityFilter !== 'all' || showMyTasks) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStatusChange('all');
            onPriorityChange('all');
            onMyTasksChange(false);
          }}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
