import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ActivityItem } from './activity-item';
import {
  formatActivityTitle,
  formatRelativeTime,
  mapActivityType,
} from '@/lib/activity/queries';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_name?: string | null;
  created_at: string;
}

interface RecentActivityCardProps {
  recentActivity: Activity[];
  totalVendors: number;
}

export function RecentActivityCard({ recentActivity, totalVendors }: RecentActivityCardProps) {
  return (
    <div data-tour="recent-activity" className="col-span-1 lg:col-span-2 card-premium p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3>Recent Activity</h3>
        <Link
          href="/activity"
          className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-0">
        {recentActivity.length > 0 ? (
          recentActivity.map(activity => (
            <ActivityItem
              key={activity.id}
              title={formatActivityTitle(activity.action, activity.entity_type)}
              description={activity.entity_name || ''}
              time={formatRelativeTime(activity.created_at)}
              type={mapActivityType(activity.action)}
            />
          ))
        ) : (
          <>
            <ActivityItem
              title="Welcome to DORA Comply!"
              description="Get started by adding your first vendor"
              time="Just now"
              type="info"
            />
            <ActivityItem
              title="Complete your organization setup"
              description="Add more details to your profile"
              time="Today"
              type="info"
            />
          </>
        )}
      </div>
      {totalVendors === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Add vendors to see activity here</p>
        </div>
      )}
    </div>
  );
}
