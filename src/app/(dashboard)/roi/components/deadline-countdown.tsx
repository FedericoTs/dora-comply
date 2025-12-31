'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeadlineCountdownProps {
  deadline: Date;
  daysRemaining: number;
}

export function DeadlineCountdown({ deadline, daysRemaining }: DeadlineCountdownProps) {
  const getUrgencyLevel = () => {
    if (daysRemaining <= 0) return 'overdue';
    if (daysRemaining <= 30) return 'critical';
    if (daysRemaining <= 90) return 'warning';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  const urgencyConfig = {
    overdue: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Deadline Passed',
    },
    critical: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Critical',
    },
    warning: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: Clock,
      label: 'Approaching',
    },
    normal: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
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
          {deadline.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          urgency === 'overdue' && 'bg-red-100 text-red-800',
          urgency === 'critical' && 'bg-red-100 text-red-800',
          urgency === 'warning' && 'bg-yellow-100 text-yellow-800',
          urgency === 'normal' && 'bg-green-100 text-green-800',
        )}>
          {config.label}
        </div>
      </CardContent>
    </Card>
  );
}
