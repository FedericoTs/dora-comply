'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, FileText, Shield, ArrowUpRight } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface RecentActivityWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string | null;
  created_at: string;
  type: 'success' | 'warning' | 'info' | 'security';
}

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  info: FileText,
  security: Shield,
};

const colors = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  security: 'text-primary',
};

export function RecentActivityWidget({ title, config }: RecentActivityWidgetProps) {
  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = config.limit ?? 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/recent-activity?limit=${limit}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.activities || []);
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">{title || 'Recent Activity'}</span>
        </div>
        <Link
          href="/activity"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        {data.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No recent activity
          </div>
        ) : (
          <div className="space-y-0">
            {data.map((activity) => {
              const Icon = icons[activity.type] || FileText;
              const color = colors[activity.type] || 'text-muted-foreground';

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className={color}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    {activity.entity_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.entity_name}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
