'use client';

/**
 * Tasks Client Component
 *
 * Handles all interactive functionality for the tasks page.
 */

import { useState, useMemo } from 'react';
import { Plus, ListTodo, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskStats } from '@/components/tasks/task-stats';
import { TaskList } from '@/components/tasks/task-list';
import { TaskFilters } from '@/components/tasks/task-filters';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet';
import type {
  TaskWithRelations,
  TaskStats as TaskStatsType,
  TaskStatus,
  TaskPriority,
} from '@/lib/tasks/types';

interface TasksClientProps {
  initialTasks: TaskWithRelations[];
  initialStats: TaskStatsType;
}

export function TasksClient({ initialTasks, initialStats }: TasksClientProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [stats, setStats] = useState<TaskStatsType>(initialStats);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [showMyTasks, setShowMyTasks] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(query) &&
          !task.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Handle task creation
  const handleTaskCreated = (newTask: TaskWithRelations) => {
    setTasks((prev) => [newTask, ...prev]);
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      open: prev.open + 1,
    }));
    setIsCreateOpen(false);
  };

  // Handle task update
  const handleTaskUpdated = (updatedTask: TaskWithRelations) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  // Handle task deletion
  const handleTaskDeleted = (taskId: string) => {
    const deletedTask = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (deletedTask) {
      const status = deletedTask.status;
      setStats((prev) => {
        const newStats = { ...prev, total: prev.total - 1 };
        // Decrement the appropriate status counter
        if (status === 'open') newStats.open = Math.max(0, prev.open - 1);
        else if (status === 'in_progress') newStats.in_progress = Math.max(0, prev.in_progress - 1);
        else if (status === 'review') newStats.review = Math.max(0, prev.review - 1);
        else if (status === 'completed') newStats.completed = Math.max(0, prev.completed - 1);
        return newStats;
      });
    }
    if (selectedTask?.id === taskId) {
      setIsDetailOpen(false);
      setSelectedTask(null);
    }
  };

  // Open task detail
  const handleOpenTask = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            Tasks
          </h1>
          <p className="text-muted-foreground">
            Track and manage compliance activities
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <TaskStats stats={stats} onFilterClick={setStatusFilter} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <TaskFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          showMyTasks={showMyTasks}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onMyTasksChange={setShowMyTasks}
        />
      </div>

      {/* Task List */}
      <TaskList
        tasks={filteredTasks}
        onTaskClick={handleOpenTask}
        onTaskUpdated={handleTaskUpdated}
        emptyMessage={
          searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
            ? 'No tasks match your filters'
            : 'No tasks yet. Create your first task to get started.'
        }
      />

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </>
  );
}
