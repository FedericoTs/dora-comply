import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  Settings,
  Inbox,
} from 'lucide-react';
import {
  getRecentActivity,
  formatActivityTitle,
  formatRelativeTime,
  mapActivityType,
  type ActivityLogEntry,
} from '@/lib/activity/queries';

export const metadata: Metadata = {
  title: 'Activity Log | DORA Comply',
  description: 'View all recent activity in your organization',
};

export default async function ActivityPage() {
  // Fetch more activity entries for the full page view
  const activities = await getRecentActivity(50);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Activity Log</h1>
          <p className="text-muted-foreground text-sm">
            Recent actions and events across your organization
          </p>
        </div>
      </div>

      {/* Activity List */}
      <div className="card-premium divide-y divide-border">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Start by adding vendors, uploading documents, or creating incidents
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function ActivityRow({ activity }: { activity: ActivityLogEntry }) {
  const type = mapActivityType(activity.action);
  const title = formatActivityTitle(activity.action, activity.entity_type);
  const time = formatRelativeTime(activity.created_at);

  const iconConfig = {
    success: { icon: CheckCircle2, class: 'text-success bg-success/10' },
    warning: { icon: AlertCircle, class: 'text-warning bg-warning/10' },
    info: { icon: FileText, class: 'text-info bg-info/10' },
  };

  const entityIconMap: Record<string, typeof Building2> = {
    vendor: Building2,
    incident: AlertTriangle,
    document: FileText,
    roi: BookOpen,
    testing: FlaskConical,
    user: Settings,
  };

  const EntityIcon = entityIconMap[activity.entity_type] || FileText;
  const StatusIcon = iconConfig[type].icon;
  const iconClass = iconConfig[type].class;

  // Build link based on entity type
  const getEntityLink = (): string | null => {
    if (!activity.entity_id) return null;

    switch (activity.entity_type) {
      case 'vendor':
        return `/vendors/${activity.entity_id}`;
      case 'incident':
        return `/incidents/${activity.entity_id}`;
      case 'document':
        return `/documents/${activity.entity_id}`;
      default:
        return null;
    }
  };

  const entityLink = getEntityLink();

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
      {/* Icon */}
      <div className={`p-2.5 rounded-xl ${iconClass}`}>
        <StatusIcon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{title}</p>
            {activity.entity_name && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <EntityIcon className="h-3.5 w-3.5" />
                {entityLink ? (
                  <Link
                    href={entityLink}
                    className="hover:text-primary hover:underline"
                  >
                    {activity.entity_name}
                  </Link>
                ) : (
                  activity.entity_name
                )}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        </div>

        {/* Additional details if present */}
        {activity.details && Object.keys(activity.details).length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            {Object.entries(activity.details).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
