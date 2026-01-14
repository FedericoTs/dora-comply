import { Calendar, Zap } from 'lucide-react';

interface DeadlineCardProps {
  daysToDeadline: number;
  avgRoiCompleteness: number;
  totalVendors: number;
}

export function DeadlineCard({
  daysToDeadline,
  avgRoiCompleteness,
  totalVendors,
}: DeadlineCardProps) {
  return (
    <div data-tour="deadline" className="card-premium p-6 animate-slide-up">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">RoI Submission</span>
      </div>
      <div className="mb-6">
        <div className="text-5xl font-semibold tracking-tight mb-1">{daysToDeadline}</div>
        <div className="text-muted-foreground">days remaining</div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{avgRoiCompleteness}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${avgRoiCompleteness}%` }} />
        </div>
      </div>
      <div className="p-4 rounded-lg bg-accent">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">
              {totalVendors === 0 ? 'Get started' : 'Keep going!'}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalVendors === 0
                ? 'Add your first vendor to begin tracking progress.'
                : `${totalVendors} vendor${totalVendors === 1 ? '' : 's'} registered. Continue building your RoI.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
