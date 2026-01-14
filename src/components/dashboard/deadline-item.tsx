import Link from 'next/link';
import { Clock } from 'lucide-react';

interface DeadlineItemProps {
  incidentId: string;
  incidentRef: string;
  title: string;
  reportType: string;
  hoursRemaining: number;
  isOverdue: boolean;
}

export function DeadlineItem({
  incidentId,
  incidentRef,
  title,
  reportType,
  hoursRemaining,
  isOverdue,
}: DeadlineItemProps) {
  const reportTypeLabel = {
    initial: 'Initial (4h)',
    intermediate: 'Intermediate (72h)',
    final: 'Final (30d)',
  }[reportType] || reportType;

  const getUrgencyStyles = () => {
    if (isOverdue) return 'bg-destructive/10 border-destructive/30 text-destructive';
    if (hoursRemaining <= 4) return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
    if (hoursRemaining <= 24) return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
    return 'bg-card border-border';
  };

  const formatTimeRemaining = () => {
    if (isOverdue) {
      const overdueDays = Math.abs(Math.floor(hoursRemaining / 24));
      const overdueHours = Math.abs(hoursRemaining % 24);
      if (overdueDays > 0) return `${overdueDays}d ${overdueHours}h overdue`;
      return `${Math.abs(hoursRemaining)}h overdue`;
    }
    if (hoursRemaining >= 24) {
      const days = Math.floor(hoursRemaining / 24);
      const hours = hoursRemaining % 24;
      return `${days}d ${hours}h remaining`;
    }
    return `${hoursRemaining}h remaining`;
  };

  return (
    <Link href={`/incidents/${incidentId}`}>
      <div className={`p-3 rounded-lg border transition-colors hover:bg-accent/50 ${getUrgencyStyles()}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-muted-foreground">{incidentRef}</span>
          <span className="text-xs font-medium">{reportTypeLabel}</span>
        </div>
        <p className="text-sm font-medium truncate mb-1">{title}</p>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{formatTimeRemaining()}</span>
        </div>
      </div>
    </Link>
  );
}
