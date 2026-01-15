'use client';

import { useEffect, useState, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DeadlineBadgeProps {
  deadline: string | Date;
  showCountdown?: boolean;
  className?: string;
}

function getTimeRemaining(deadline: Date) {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isOverdue: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isOverdue: false };
}

function formatCountdown(hours: number, minutes: number, seconds: number) {
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getUrgencyLevel(hours: number, isOverdue: boolean) {
  if (isOverdue) return 'overdue';
  if (hours < 1) return 'critical';
  if (hours < 4) return 'urgent';
  if (hours < 24) return 'warning';
  return 'normal';
}

export function DeadlineBadge({
  deadline,
  showCountdown = true,
  className,
}: DeadlineBadgeProps) {
  const deadlineDate = useMemo(
    () => (typeof deadline === 'string' ? new Date(deadline) : deadline),
    [deadline]
  );
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeRemaining(deadlineDate));

  useEffect(() => {
    if (!showCountdown) return;

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadlineDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineDate, showCountdown]);

  const { hours, minutes, seconds, isOverdue } = timeRemaining;
  const urgency = getUrgencyLevel(hours, isOverdue);

  const urgencyStyles = {
    overdue: 'bg-error/20 text-error border-error/30',
    critical: 'bg-error/10 text-error border-error/20 animate-pulse',
    urgent: 'bg-warning/20 text-warning border-warning/30',
    warning: 'bg-warning/10 text-warning border-warning/20',
    normal: 'bg-success/10 text-success border-success/20',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-mono text-xs',
        urgencyStyles[urgency],
        className
      )}
    >
      {isOverdue ? (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span>OVERDUE</span>
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          {showCountdown ? (
            <span>{formatCountdown(hours, minutes, seconds)}</span>
          ) : (
            <span>
              {hours > 24
                ? `${Math.floor(hours / 24)}d remaining`
                : `${hours}h remaining`
              }
            </span>
          )}
        </>
      )}
    </Badge>
  );
}

// Static version for server components
export function DeadlineBadgeStatic({
  deadline,
  className,
}: {
  deadline: string | Date;
  className?: string;
}) {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();
  const isOverdue = diff <= 0;
  const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const urgency = getUrgencyLevel(hours, isOverdue);

  const urgencyStyles = {
    overdue: 'bg-error/20 text-error border-error/30',
    critical: 'bg-error/10 text-error border-error/20',
    urgent: 'bg-warning/20 text-warning border-warning/30',
    warning: 'bg-warning/10 text-warning border-warning/20',
    normal: 'bg-success/10 text-success border-success/20',
  };

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 text-xs', urgencyStyles[urgency], className)}
    >
      {isOverdue ? (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span>Overdue</span>
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          <span>
            {hours > 24
              ? `${Math.floor(hours / 24)}d remaining`
              : `${hours}h remaining`}
          </span>
        </>
      )}
    </Badge>
  );
}
