'use client';

import { FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ConcentrationAlert } from '@/lib/concentration/types';
import type { AlertWorkflow } from './types';
import { ALERT_WORKFLOWS } from './constants';

interface WorkflowProgressProps {
  alert: ConcentrationAlert;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
}

export function WorkflowProgress({
  alert,
  completedCount,
  totalCount,
  progressPercentage,
}: WorkflowProgressProps) {
  const workflow: AlertWorkflow | undefined = ALERT_WORKFLOWS[alert.type];
  const WorkflowIcon = workflow?.icon || FileText;

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WorkflowIcon className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">
            {workflow?.title || 'Mitigation Workflow'}
          </span>
        </div>
        <span className="text-sm font-medium">
          {completedCount}/{totalCount} complete
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {workflow?.description || alert.description}
      </p>
    </div>
  );
}
