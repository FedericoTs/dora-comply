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
    card: 'border-warning/30 bg-warning/10',
    value: 'text-warning',
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
    if (val >= 80) return 'text-success';
    if (val >= 50) return 'text-warning';
    return 'text-error';
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
                value >= 80 ? 'bg-success' :
                value >= 50 ? 'bg-warning' :
                'bg-error'
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
