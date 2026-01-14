'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkflowFooterProps {
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  onResetProgress: () => void;
  onMarkAllComplete: () => void;
  onClose: () => void;
  onMarkResolved: () => void;
}

export function WorkflowFooter({
  completedCount,
  totalCount,
  progressPercentage,
  onResetProgress,
  onMarkAllComplete,
  onClose,
  onMarkResolved,
}: WorkflowFooterProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetProgress}
          disabled={completedCount === 0}
        >
          Reset Progress
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkAllComplete}
          disabled={completedCount === totalCount}
        >
          Mark All Complete
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {progressPercentage === 100 && (
          <Button onClick={onMarkResolved}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        )}
      </div>
    </div>
  );
}
