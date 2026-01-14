import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Target,
  Scale,
} from 'lucide-react';

interface AlertBannersProps {
  overdueReports: number;
  tlptRequired: boolean;
  tlptOverdue: number;
  tlptDueSoon: number;
  simplifiedFramework: boolean;
}

export function AlertBanners({
  overdueReports,
  tlptRequired,
  tlptOverdue,
  tlptDueSoon,
  simplifiedFramework,
}: AlertBannersProps) {
  return (
    <>
      {/* Overdue Reports Alert Banner */}
      {overdueReports > 0 && (
        <div className="mb-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10 animate-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">
                  {overdueReports} incident report{overdueReports === 1 ? '' : 's'} overdue
                </p>
                <p className="text-sm text-muted-foreground">
                  DORA requires timely submission to avoid regulatory penalties
                </p>
              </div>
            </div>
            <Link
              href="/incidents?filter=overdue"
              className="btn-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0"
            >
              Review Overdue
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* TLPT Overdue Alert Banner */}
      {tlptRequired && tlptOverdue > 0 && (
        <div className="mb-4 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10 animate-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-500">
                  TLPT testing overdue
                </p>
                <p className="text-sm text-muted-foreground">
                  DORA Article 26 requires threat-led penetration testing every 3 years for significant entities
                </p>
              </div>
            </div>
            <Link
              href="/testing/tlpt"
              className="btn-primary bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              Schedule TLPT
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* TLPT Due Soon Warning */}
      {tlptRequired && tlptOverdue === 0 && tlptDueSoon > 0 && (
        <div className="mb-4 p-4 rounded-lg border border-blue-500/50 bg-blue-500/10 animate-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-400">
                  TLPT testing due within 6 months
                </p>
                <p className="text-sm text-muted-foreground">
                  Plan your next threat-led penetration test to maintain compliance
                </p>
              </div>
            </div>
            <Link href="/testing/tlpt" className="btn-secondary shrink-0">
              View TLPT Schedule
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Simplified Framework Banner */}
      {simplifiedFramework && (
        <div className="mb-4 p-4 rounded-lg border border-success/50 bg-success/10 animate-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
              <Scale className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-success">
                Simplified ICT Risk Framework (Article 16)
              </p>
              <p className="text-sm text-muted-foreground">
                Your organization qualifies for proportionate DORA requirements. TLPT is not mandatory.
              </p>
            </div>
            <Link
              href="/settings/organization"
              className="btn-ghost text-success hover:text-success/80"
            >
              View Classification
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
