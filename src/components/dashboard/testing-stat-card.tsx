import Link from 'next/link';
import { HelpTooltip, KPI_HELP } from '@/components/ui/help-tooltip';

type TLPTStatus = 'overdue' | 'due_soon' | 'compliant';

interface TestingStatCardProps {
  testTypeCoverage: number;
  openFindings: number;
  tlptStatus: TLPTStatus;
  tlptRequired: boolean;
}

export function TestingStatCard({
  testTypeCoverage,
  openFindings,
  tlptStatus,
  tlptRequired,
}: TestingStatCardProps) {
  const getStatusDisplay = () => {
    // If TLPT is not required (non-significant entity), show different status
    if (!tlptRequired) {
      return { label: 'TLPT N/A', color: 'text-muted-foreground', bgColor: 'bg-muted' };
    }
    switch (tlptStatus) {
      case 'overdue':
        return { label: 'TLPT Overdue', color: 'text-destructive', bgColor: 'bg-destructive/10' };
      case 'due_soon':
        return { label: 'TLPT Due Soon', color: 'text-amber-600', bgColor: 'bg-amber-500/10' };
      default:
        return { label: 'TLPT Compliant', color: 'text-success', bgColor: 'bg-success/10' };
    }
  };

  const status = getStatusDisplay();

  return (
    <Link href="/testing" className="stat-card group hover:border-primary/50 transition-colors">
      <p className="stat-label mb-2 flex items-center gap-1">
        {tlptRequired ? 'Testing & TLPT' : 'Resilience Testing'}
        <HelpTooltip content={KPI_HELP.testingCoverage} iconClassName="h-3.5 w-3.5" />
      </p>
      <div className="flex items-baseline gap-2">
        <p className="stat-value">{testTypeCoverage}%</p>
        <span className="text-xs text-muted-foreground">coverage</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${status.color} ${status.bgColor}`}>
          {status.label}
        </span>
        {openFindings > 0 && (
          <span className="text-xs text-muted-foreground">
            {openFindings} critical
          </span>
        )}
      </div>
    </Link>
  );
}
