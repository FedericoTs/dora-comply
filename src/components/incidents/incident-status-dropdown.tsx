'use client';

/**
 * Incident Status Dropdown
 *
 * Allows changing incident status with proper workflow transitions
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updateIncidentAction } from '@/lib/incidents/actions';
import type { IncidentStatus } from '@/lib/incidents/types';

interface IncidentStatusDropdownProps {
  incidentId: string;
  currentStatus: IncidentStatus;
  classification: 'major' | 'significant' | 'minor';
}

// Define valid status transitions
const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  draft: ['detected'],
  detected: ['initial_submitted', 'closed'],
  initial_submitted: ['intermediate_submitted', 'closed'],
  intermediate_submitted: ['final_submitted', 'closed'],
  final_submitted: ['closed'],
  closed: [], // No transitions from closed
};

// Status labels and colors
const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string; description: string }> = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    description: 'Incident is being documented',
  },
  detected: {
    label: 'Detected',
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    description: 'Incident has been formally detected and classified',
  },
  initial_submitted: {
    label: 'Initial Submitted',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    description: 'Initial report submitted to regulator',
  },
  intermediate_submitted: {
    label: 'Intermediate Submitted',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    description: 'Intermediate report submitted to regulator',
  },
  final_submitted: {
    label: 'Final Submitted',
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
    description: 'Final report submitted to regulator',
  },
  closed: {
    label: 'Closed',
    color: 'bg-slate-100 text-slate-500 hover:bg-slate-200',
    description: 'Incident has been resolved and closed',
  },
};

export function IncidentStatusDropdown({
  incidentId,
  currentStatus,
  classification,
}: IncidentStatusDropdownProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  const currentConfig = STATUS_CONFIG[currentStatus];

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    setOpen(false);

    try {
      const result = await updateIncidentAction(incidentId, { status: newStatus });

      if (result.success) {
        toast.success('Status updated', {
          description: `Incident status changed to ${STATUS_CONFIG[newStatus].label}`,
        });
        router.refresh();
      } else {
        toast.error('Failed to update status', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Failed to update status', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // If no transitions available, show static badge
  if (availableTransitions.length === 0) {
    return (
      <Badge variant="outline" className={cn('text-sm', currentConfig.color)}>
        {currentConfig.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', currentConfig.color)}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              {currentConfig.label}
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Change Status
        </div>
        <DropdownMenuSeparator />
        {availableTransitions.map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className="flex flex-col items-start gap-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  {config.label}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground pl-0.5">
                {config.description}
              </span>
            </DropdownMenuItem>
          );
        })}
        {classification === 'major' && currentStatus !== 'closed' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Note: Status updates should align with report submissions for DORA compliance.
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
