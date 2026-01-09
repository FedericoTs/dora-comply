'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

/**
 * Contextual help tooltip for form fields and complex UI elements.
 * Use next to form labels to provide additional context.
 *
 * @example
 * <FormLabel className="flex items-center gap-1.5">
 *   LEI Code
 *   <HelpTooltip content="Legal Entity Identifier - a 20-character unique code" />
 * </FormLabel>
 */
export function HelpTooltip({
  content,
  side = 'top',
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'text-muted-foreground hover:text-foreground transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
          aria-label="Help"
        >
          <HelpCircle className={cn('h-4 w-4', iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * DORA-specific help content for common fields
 */
export const DORA_HELP = {
  lei: 'Legal Entity Identifier (LEI) - A unique 20-character code that identifies legal entities participating in financial transactions. Required for DORA compliance.',
  tier: 'Vendor tier classification based on criticality: Critical (essential services), Important (significant impact), or Standard (routine services).',
  criticalFunction: 'A function whose disruption would materially impair the financial entity\'s ability to meet regulatory obligations or continue business.',
  providerType: 'The category of ICT services provided: Cloud (IaaS/PaaS/SaaS), Data Center, Network, Software, Security, or Other.',
  intraGroup: 'Select if this vendor is part of your corporate group or provides services through an intra-group arrangement.',
  subcontracting: 'Information about any subcontractors used by this vendor to deliver services to your organization.',
  exitStrategy: 'Your plan for transitioning away from this vendor if needed, including data portability and service continuity.',
} as const;
