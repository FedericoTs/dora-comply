'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RoiProgressCardProps {
  title: string;
  value: number;
  suffix?: string;
  description: string;
  variant?: 'default' | 'progress' | 'warning' | 'highlight';
}

const variantStyles = {
  default: {
    card: '',
    value: '',
  },
  progress: {
    card: '',
    value: '', // Calculated dynamically
  },
  warning: {
    card: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10',
    value: 'text-amber-600 dark:text-amber-500',
  },
  highlight: {
    card: 'border-primary/30 bg-primary/5',
    value: 'text-primary',
  },
};

export function RoiProgressCard({
  title,
  value,
  suffix,
  description,
  variant = 'default',
}: RoiProgressCardProps) {
  const getProgressColor = (val: number) => {
    if (val >= 80) return 'text-green-600 dark:text-green-500';
    if (val >= 50) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  const styles = variantStyles[variant];
  const valueClass = variant === 'progress' ? getProgressColor(value) : styles.value;

  return (
    <Card className={cn(styles.card)}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={cn('text-3xl font-bold', valueClass)}>
          {value.toLocaleString()}
          {suffix && <span className="text-lg font-normal text-muted-foreground">{suffix}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {variant === 'progress' && (
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                value >= 80 ? 'bg-green-600' :
                value >= 50 ? 'bg-yellow-600' :
                'bg-red-600'
              )}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
