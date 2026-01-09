'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeadlineCountdownProps {
  deadline: Date | string;
  daysRemaining: number;
}

export function DeadlineCountdown({ deadline, daysRemaining }: DeadlineCountdownProps) {
  // Convert deadline to Date if it was serialized as a string from Server Component
  const deadlineDate = useMemo(() => {
    return deadline instanceof Date ? deadline : new Date(deadline);
  }, [deadline]);
  const getUrgencyLevel = () => {
    if (daysRemaining <= 0) return 'overdue';
    if (daysRemaining <= 30) return 'critical';
    if (daysRemaining <= 90) return 'warning';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  const urgencyConfig = {
    overdue: {
      color: 'text-error',
      bg: 'bg-error/10',
      border: 'border-error/30',
      icon: AlertTriangle,
      label: 'Deadline Passed',
    },
    critical: {
      color: 'text-error',
      bg: 'bg-error/10',
      border: 'border-error/30',
      icon: AlertTriangle,
      label: 'Critical',
    },
    warning: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      icon: Clock,
      label: 'Approaching',
    },
    normal: {
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/30',
      icon: CheckCircle,
      label: 'On Track',
    },
  };

  const config = urgencyConfig[urgency];
  const Icon = config.icon;

  return (
    <Card className={cn('border-2', config.border, config.bg)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>ESA Deadline</CardDescription>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <CardTitle className={cn('text-3xl font-bold', config.color)}>
          {daysRemaining <= 0 ? 'Overdue' : `${daysRemaining} days`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {deadlineDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          urgency === 'overdue' && 'bg-error/20 text-error',
          urgency === 'critical' && 'bg-error/20 text-error',
          urgency === 'warning' && 'bg-warning/20 text-warning',
          urgency === 'normal' && 'bg-success/20 text-success',
        )}>
          {config.label}
        </div>
      </CardContent>
    </Card>
  );
}
