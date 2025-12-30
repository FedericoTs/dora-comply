import { Building2, AlertTriangle, CheckCircle2, Clock, Shield, FileCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { VendorStats } from '@/lib/vendors/types';

interface VendorStatsProps {
  stats: VendorStats;
}

export function VendorStatsCards({ stats }: VendorStatsProps) {
  const statCards = [
    {
      label: 'Total Vendors',
      value: stats.total,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Critical',
      value: stats.by_tier.critical,
      icon: AlertTriangle,
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
    {
      label: 'Active',
      value: stats.by_status.active,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Pending Review',
      value: stats.pending_reviews,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'RoI Ready',
      value: `${stats.roi_ready_percentage}%`,
      icon: FileCheck,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Avg Risk Score',
      value: stats.avg_risk_score !== null ? stats.avg_risk_score : '-',
      icon: Shield,
      color: stats.avg_risk_score !== null && stats.avg_risk_score > 60 ? 'text-error' : 'text-muted-foreground',
      bgColor: stats.avg_risk_score !== null && stats.avg_risk_score > 60 ? 'bg-error/10' : 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {statCards.map((stat) => (
        <Card key={stat.label} className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Compact version for dashboard
export function VendorStatsCompact({ stats }: VendorStatsProps) {
  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{stats.total}</span>
        <span className="text-sm text-muted-foreground">vendors</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-error" />
          <span className="text-muted-foreground">
            {stats.by_tier.critical} critical
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-muted-foreground">
            {stats.by_tier.important} important
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-muted-foreground">
            {stats.by_status.active} active
          </span>
        </div>
      </div>
    </div>
  );
}
