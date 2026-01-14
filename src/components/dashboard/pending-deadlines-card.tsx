import Link from 'next/link';
import { Clock, CheckCircle2 } from 'lucide-react';
import { DeadlineItem } from './deadline-item';

interface PendingDeadline {
  incident_id: string;
  incident_ref: string;
  incident_title: string;
  report_type: string;
  hours_remaining: number;
  is_overdue: boolean;
}

interface PendingDeadlinesCardProps {
  pendingDeadlines: PendingDeadline[];
}

export function PendingDeadlinesCard({ pendingDeadlines }: PendingDeadlinesCardProps) {
  return (
    <div className="card-premium p-6 animate-slide-up">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Report Deadlines</span>
      </div>
      {pendingDeadlines.length > 0 ? (
        <div className="space-y-3">
          {pendingDeadlines.slice(0, 3).map((deadline) => (
            <DeadlineItem
              key={`${deadline.incident_id}-${deadline.report_type}`}
              incidentId={deadline.incident_id}
              incidentRef={deadline.incident_ref}
              title={deadline.incident_title}
              reportType={deadline.report_type}
              hoursRemaining={deadline.hours_remaining}
              isOverdue={deadline.is_overdue}
            />
          ))}
          {pendingDeadlines.length > 3 && (
            <Link
              href="/incidents"
              className="block text-center text-sm text-primary font-medium hover:underline pt-2"
            >
              View all {pendingDeadlines.length} deadlines
            </Link>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
          <p className="text-sm font-medium text-success">All caught up!</p>
          <p className="text-xs text-muted-foreground">No pending report deadlines</p>
        </div>
      )}
    </div>
  );
}
