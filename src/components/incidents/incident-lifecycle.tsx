'use client';

/**
 * Incident Lifecycle Diagram
 *
 * Visual representation of the DORA incident reporting lifecycle
 * showing progress through Initial → Intermediate → Final stages
 */

import { CheckCircle2, Clock, AlertCircle, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

export type ReportStage = 'initial' | 'intermediate' | 'final';
export type StageStatus = 'completed' | 'current' | 'pending' | 'overdue';

interface ReportInfo {
  report_type: ReportStage;
  status: 'draft' | 'submitted' | 'acknowledged' | 'rejected';
  deadline: Date;
  submitted_at?: string | null;
}

interface IncidentLifecycleProps {
  /** Classification of the incident */
  classification: 'major' | 'significant' | 'minor';
  /** Detection datetime for calculating deadlines */
  detectionDatetime: Date;
  /** List of reports submitted for this incident */
  reports: ReportInfo[];
  /** Current incident status */
  incidentStatus: string;
  /** Whether to show a compact version */
  compact?: boolean;
}

interface StageConfig {
  id: ReportStage;
  label: string;
  shortLabel: string;
  deadline: string;
  deadlineHours: number;
}

// ============================================================================
// Constants
// ============================================================================

const STAGES: StageConfig[] = [
  { id: 'initial', label: 'Initial Report', shortLabel: 'Initial', deadline: '4 hours', deadlineHours: 4 },
  { id: 'intermediate', label: 'Intermediate Report', shortLabel: 'Intermediate', deadline: '72 hours', deadlineHours: 72 },
  { id: 'final', label: 'Final Report', shortLabel: 'Final', deadline: '30 days', deadlineHours: 720 },
];

// ============================================================================
// Helpers
// ============================================================================

function calculateDeadline(detectionDate: Date, hours: number): Date {
  return new Date(detectionDate.getTime() + hours * 60 * 60 * 1000);
}

function getStageStatus(
  stage: StageConfig,
  reports: ReportInfo[],
  detectionDatetime: Date,
  currentIndex: number,
  completedStages: number
): StageStatus {
  const report = reports.find(r => r.report_type === stage.id);
  const deadline = calculateDeadline(detectionDatetime, stage.deadlineHours);
  const now = new Date();

  // Check if this stage has a submitted/acknowledged report
  if (report && (report.status === 'submitted' || report.status === 'acknowledged')) {
    return 'completed';
  }

  // Check if this is the current stage (first incomplete stage)
  if (currentIndex === completedStages) {
    // Check if overdue
    if (now > deadline) {
      return 'overdue';
    }
    return 'current';
  }

  return 'pending';
}

function formatDeadline(deadline: Date): string {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours}h overdue`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d overdue`;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `${hours}h remaining`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d remaining`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Component
// ============================================================================

export function IncidentLifecycle({
  classification,
  detectionDatetime,
  reports,
  incidentStatus,
  compact = false,
}: IncidentLifecycleProps) {
  // Non-major incidents don't require regulatory reporting
  if (classification !== 'major') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50',
        compact && 'text-sm'
      )}>
        <Circle className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {classification === 'significant' ? 'Significant' : 'Minor'} incidents do not require regulatory reporting under DORA Article 19
        </span>
      </div>
    );
  }

  // Calculate completed stages
  const completedStages = reports.filter(
    r => r.status === 'submitted' || r.status === 'acknowledged'
  ).length;

  // Determine status for each stage
  const stageStatuses = STAGES.map((stage, index) =>
    getStageStatus(stage, reports, detectionDatetime, index, completedStages)
  );

  return (
    <TooltipProvider>
      <div className={cn('w-full', compact ? 'py-2' : 'py-4')}>
        {/* Header */}
        {!compact && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Reporting Lifecycle</h3>
            <span className="text-xs text-muted-foreground">
              {completedStages} of {STAGES.length} reports submitted
            </span>
          </div>
        )}

        {/* Lifecycle Diagram */}
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />

          {/* Progress Bar Fill */}
          <div
            className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(completedStages / STAGES.length) * 100}%` }}
          />

          {/* Stages */}
          <div className="relative flex justify-between">
            {STAGES.map((stage, index) => {
              const status = stageStatuses[index];
              const deadline = calculateDeadline(detectionDatetime, stage.deadlineHours);
              const report = reports.find(r => r.report_type === stage.id);

              return (
                <div
                  key={stage.id}
                  className={cn(
                    'flex flex-col items-center',
                    index === 0 && 'items-start',
                    index === STAGES.length - 1 && 'items-end'
                  )}
                >
                  {/* Stage Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-all',
                          status === 'completed' && 'border-primary bg-primary text-primary-foreground',
                          status === 'current' && 'border-primary text-primary',
                          status === 'overdue' && 'border-destructive bg-destructive text-destructive-foreground',
                          status === 'pending' && 'border-muted-foreground/30 text-muted-foreground'
                        )}
                      >
                        {status === 'completed' && <CheckCircle2 className="h-5 w-5" />}
                        {status === 'current' && <Clock className="h-5 w-5" />}
                        {status === 'overdue' && <AlertCircle className="h-5 w-5" />}
                        {status === 'pending' && <Circle className="h-5 w-5" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{stage.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Deadline: {stage.deadline} from detection
                        </p>
                        <p className="text-xs">
                          Due: {formatDate(deadline)}
                        </p>
                        {status === 'completed' && report?.submitted_at && (
                          <p className="text-xs text-success">
                            Submitted: {formatDate(new Date(report.submitted_at))}
                          </p>
                        )}
                        {status === 'overdue' && (
                          <p className="text-xs text-destructive font-medium">
                            {formatDeadline(deadline)}
                          </p>
                        )}
                        {status === 'current' && (
                          <p className="text-xs text-primary font-medium">
                            {formatDeadline(deadline)}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Stage Label */}
                  <div className={cn(
                    'mt-2 text-center',
                    index === 0 && 'text-left',
                    index === STAGES.length - 1 && 'text-right'
                  )}>
                    <p className={cn(
                      'text-xs font-medium',
                      status === 'completed' && 'text-primary',
                      status === 'current' && 'text-foreground',
                      status === 'overdue' && 'text-destructive',
                      status === 'pending' && 'text-muted-foreground'
                    )}>
                      {compact ? stage.shortLabel : stage.label}
                    </p>
                    {!compact && (
                      <p className={cn(
                        'text-xs',
                        status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        {status === 'completed' ? 'Submitted' : status === 'overdue' ? formatDeadline(deadline) : stage.deadline}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Summary */}
        {!compact && (
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
              <span className="text-muted-foreground">Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-muted-foreground/30" />
              <span className="text-muted-foreground">Pending</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Compact Version for Lists
// ============================================================================

export function IncidentLifecycleCompact({
  classification,
  reports,
}: {
  classification: 'major' | 'significant' | 'minor';
  reports: { report_type: ReportStage; status: string }[];
}) {
  if (classification !== 'major') {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }

  const completed = reports.filter(
    r => r.status === 'submitted' || r.status === 'acknowledged'
  );

  const hasInitial = completed.some(r => r.report_type === 'initial');
  const hasIntermediate = completed.some(r => r.report_type === 'intermediate');
  const hasFinal = completed.some(r => r.report_type === 'final');

  return (
    <div className="flex items-center gap-1">
      <StageIndicator completed={hasInitial} label="I" />
      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
      <StageIndicator completed={hasIntermediate} label="II" />
      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
      <StageIndicator completed={hasFinal} label="F" />
    </div>
  );
}

function StageIndicator({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div
      className={cn(
        'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium',
        completed
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {completed ? '✓' : label}
    </div>
  );
}
