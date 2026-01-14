import { CheckCircle2, AlertCircle, FileText, Shield } from 'lucide-react';

type ActivityType = 'success' | 'warning' | 'info' | 'security';

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type: ActivityType;
}

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  info: FileText,
  security: Shield,
};

const colors = {
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  security: 'text-primary',
};

export function ActivityItem({ title, description, time, type }: ActivityItemProps) {
  const Icon = icons[type];

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className={colors[type]}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <p className="text-sm text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}
