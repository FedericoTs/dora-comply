'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListTodo, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface PendingTasksWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface TaskItem {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date: string | null;
  plan_id: string;
}

export function PendingTasksWidget({ title, config }: PendingTasksWidgetProps) {
  const [data, setData] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = config.limit ?? 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/pending-tasks?limit=${limit}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.tasks || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', class: 'text-red-600' };
    if (diffDays === 0) return { text: 'Today', class: 'text-amber-600' };
    if (diffDays === 1) return { text: 'Tomorrow', class: 'text-amber-600' };
    if (diffDays <= 7) return { text: `${diffDays}d`, class: 'text-muted-foreground' };
    return { text: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), class: 'text-muted-foreground' };
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <ListTodo className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Pending Tasks'}</span>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
      ) : (
        <div className="space-y-2">
          {data.map((task) => {
            const due = formatDueDate(task.due_date);
            return (
              <Link
                key={task.id}
                href={`/remediation/${task.plan_id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                    {due && (
                      <span className={`flex items-center gap-1 text-xs ${due.class}`}>
                        <Clock className="h-3 w-3" />
                        {due.text}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
