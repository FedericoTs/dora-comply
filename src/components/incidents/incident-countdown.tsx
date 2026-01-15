'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncidentCountdownProps {
  /** Target deadline as ISO string or Date */
  deadline: string | Date;
  /** Label for the deadline type (e.g., "Initial Report", "Intermediate Report") */
  label?: string;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Live countdown timer for incident reporting deadlines.
 * Updates every second when < 1 hour, every minute otherwise.
 * Shows urgency colors based on time remaining.
 */
// Calculate time remaining helper
function calculateTimeRemaining(deadline: string | Date) {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) {
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);
    return { total: diff, hours, minutes, seconds, isOverdue: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { total: diff, hours, minutes, seconds, isOverdue: false };
}

export function IncidentCountdown({
  deadline,
  label,
  compact = false,
  className,
}: IncidentCountdownProps) {
  // Initialize with calculated value to avoid setState in effect
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(deadline));

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [deadline]);

  const { hours, minutes, seconds, isOverdue } = timeRemaining;

  // Determine urgency level for styling
  const getUrgencyLevel = () => {
    if (isOverdue) return 'critical';
    if (hours < 1) return 'critical';
    if (hours < 4) return 'high';
    if (hours < 24) return 'medium';
    return 'low';
  };

  const urgency = getUrgencyLevel();

  const urgencyStyles = {
    critical: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      text: 'text-destructive',
      icon: AlertTriangle,
    },
    high: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      icon: AlertTriangle,
    },
    medium: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      icon: Clock,
    },
    low: {
      bg: 'bg-muted',
      border: 'border-border',
      text: 'text-muted-foreground',
      icon: Clock,
    },
  };

  const style = urgencyStyles[urgency];
  const Icon = style.icon;

  // Format the time display
  const formatTime = () => {
    if (isOverdue) {
      if (hours > 0) return `${hours}h ${minutes}m overdue`;
      if (minutes > 0) return `${minutes}m ${seconds}s overdue`;
      return `${seconds}s overdue`;
    }

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
    return `${seconds}s remaining`;
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', style.text, className)}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium tabular-nums">{formatTime()}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        style.bg,
        style.border,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', style.text)} />
        <div>
          {label && (
            <p className={cn('text-sm font-medium', style.text)}>{label}</p>
          )}
          <p className={cn('text-xs', isOverdue ? style.text : 'text-muted-foreground')}>
            {isOverdue ? 'Deadline passed' : 'Time remaining'}
          </p>
        </div>
      </div>
      <div className={cn('text-right', style.text)}>
        <p className="text-lg font-semibold tabular-nums">
          {hours > 0 && <span>{hours}h </span>}
          <span>{minutes}m</span>
          {hours === 0 && <span> {seconds}s</span>}
        </p>
        {isOverdue && <p className="text-xs font-medium">OVERDUE</p>}
      </div>
    </div>
  );
}

/**
 * Compact badge-style countdown for use in tables/lists
 */
export function IncidentCountdownBadge({
  deadline,
  className,
}: {
  deadline: string | Date;
  className?: string;
}) {
  return <IncidentCountdown deadline={deadline} compact className={className} />;
}
