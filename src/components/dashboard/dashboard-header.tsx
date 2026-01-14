import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BoardReportExport } from '@/components/reports/board-report-export';
import { getGreeting } from '@/lib/utils/greeting';

interface DashboardHeaderProps {
  firstName: string;
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  return (
    <div data-tour="welcome" className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 animate-in">
      <div>
        <h1 className="mb-1">{getGreeting()}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your compliance program today.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <BoardReportExport />
        <Link href="/vendors/new" className="btn-primary" data-tour="add-vendor">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add vendor</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>
    </div>
  );
}
