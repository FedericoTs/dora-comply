import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HelpTooltip, KPI_HELP } from '@/components/ui/help-tooltip';

interface IncidentStatCardProps {
  major: number;
  significant: number;
  pending: number;
}

export function IncidentStatCard({ major, significant, pending }: IncidentStatCardProps) {
  const total = major + significant;
  const hasCritical = major > 0;

  return (
    <Link href="/incidents" className="stat-card group hover:border-primary/50 transition-colors">
      <p className="stat-label mb-2 flex items-center gap-1">
        Active Incidents
        <HelpTooltip content={KPI_HELP.activeIncidents} iconClassName="h-3.5 w-3.5" />
      </p>
      <div className="flex items-baseline gap-2">
        <p className={`stat-value ${hasCritical ? 'text-destructive' : ''}`}>{total}</p>
        {hasCritical && (
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
            {major} major
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        {pending > 0 ? (
          <>
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning font-medium">{pending} pending</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">All reported</span>
          </>
        )}
      </div>
    </Link>
  );
}
