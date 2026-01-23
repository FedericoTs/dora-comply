'use client';

/**
 * Task List Component
 *
 * Renders a list of task cards.
 */

import { ListTodo } from 'lucide-react';
import { TaskCard } from './task-card';
import type { TaskWithRelations } from '@/lib/tasks/types';

interface TaskListProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  onTaskUpdated?: (task: TaskWithRelations) => void;
  onTaskDeleted?: (taskId: string) => void;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  onTaskClick,
  onTaskUpdated,
  onTaskDeleted,
  emptyMessage = 'No tasks found',
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-muted/30">
        <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => onTaskClick?.(task)}
          onUpdated={onTaskUpdated}
          onDeleted={onTaskDeleted}
        />
      ))}
    </div>
  );
}
