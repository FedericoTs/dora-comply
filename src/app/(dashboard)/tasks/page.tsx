/**
 * Tasks Page
 *
 * Task management dashboard for tracking compliance activities.
 */

import { Suspense } from 'react';
import { getTasks, getTaskStats } from '@/lib/tasks/queries';
import { TasksClient } from './tasks-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Tasks | Compliance Platform',
  description: 'Manage and track compliance tasks',
};

async function TasksContent() {
  const [tasks, stats] = await Promise.all([
    getTasks(),
    getTaskStats(),
  ]);

  return <TasksClient initialTasks={tasks} initialStats={stats} />;
}

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TasksLoading />}>
        <TasksContent />
      </Suspense>
    </div>
  );
}

function TasksLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      {/* Task list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
