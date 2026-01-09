'use client';

/**
 * Template Navigation Component
 *
 * Provides Previous/Next navigation between RoI templates
 * Enables users to efficiently work through all 15 ESA templates
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type RoiTemplateId,
  ROI_TEMPLATES,
  getTemplateUrl,
} from '@/lib/roi/types';

// ============================================================================
// Types
// ============================================================================

interface TemplateStatus {
  rowCount: number;
  errorCount: number;
  completeness: number; // 0-100
}

interface TemplateNavigationProps {
  currentTemplateId: RoiTemplateId;
  /** Optional status for all templates to show progress indicators */
  templateStatuses?: Partial<Record<RoiTemplateId, TemplateStatus>>;
  /** Show compact version (smaller buttons) */
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Template Order
// ============================================================================

// Ordered list of all templates (excluding B_99.01 lookup values)
const TEMPLATE_ORDER: RoiTemplateId[] = [
  'B_01.01', // Entity Maintaining Register
  'B_01.02', // Entities in Scope
  'B_01.03', // Branches
  'B_02.01', // Contractual Arrangements Overview
  'B_02.02', // Contractual Arrangements Details
  'B_02.03', // Linked Arrangements
  'B_03.01', // Entity-Arrangement Links
  'B_03.02', // Provider-Arrangement Links
  'B_03.03', // Intra-Group Provider Links
  'B_04.01', // Service Recipients
  'B_05.01', // ICT Providers
  'B_05.02', // Subcontracting
  'B_06.01', // Critical Functions
  'B_07.01', // Exit Arrangements
];

// Group templates for better UX
const TEMPLATE_GROUPS: { name: string; templates: RoiTemplateId[] }[] = [
  {
    name: 'Entity Information',
    templates: ['B_01.01', 'B_01.02', 'B_01.03'],
  },
  {
    name: 'Contractual Arrangements',
    templates: ['B_02.01', 'B_02.02', 'B_02.03'],
  },
  {
    name: 'Links',
    templates: ['B_03.01', 'B_03.02', 'B_03.03'],
  },
  {
    name: 'Service & Providers',
    templates: ['B_04.01', 'B_05.01', 'B_05.02'],
  },
  {
    name: 'Functions & Exit',
    templates: ['B_06.01', 'B_07.01'],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getAdjacentTemplates(templateId: RoiTemplateId): {
  prev: RoiTemplateId | null;
  next: RoiTemplateId | null;
  currentIndex: number;
  total: number;
} {
  const currentIndex = TEMPLATE_ORDER.indexOf(templateId);

  return {
    prev: currentIndex > 0 ? TEMPLATE_ORDER[currentIndex - 1] : null,
    next: currentIndex < TEMPLATE_ORDER.length - 1 ? TEMPLATE_ORDER[currentIndex + 1] : null,
    currentIndex,
    total: TEMPLATE_ORDER.length,
  };
}

function getStatusIcon(status?: TemplateStatus) {
  if (!status) {
    return <Circle className="h-3 w-3 text-muted-foreground" />;
  }

  if (status.errorCount > 0) {
    return <AlertCircle className="h-3 w-3 text-destructive" />;
  }

  if (status.completeness >= 100 && status.rowCount > 0) {
    return <CheckCircle2 className="h-3 w-3 text-success" />;
  }

  if (status.rowCount > 0) {
    return <Circle className="h-3 w-3 text-info fill-info/20" />;
  }

  return <Circle className="h-3 w-3 text-muted-foreground" />;
}

// ============================================================================
// Component
// ============================================================================

export function TemplateNavigation({
  currentTemplateId,
  templateStatuses,
  compact = false,
  className,
}: TemplateNavigationProps) {
  const { prev, next, currentIndex, total } = getAdjacentTemplates(currentTemplateId);
  const prevTemplate = prev ? ROI_TEMPLATES[prev] : null;
  const nextTemplate = next ? ROI_TEMPLATES[next] : null;

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3',
          compact && 'p-2',
          className
        )}
      >
        {/* Previous Button */}
        <div className="flex-1">
          {prevTemplate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={compact ? 'sm' : 'default'}
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <Link href={getTemplateUrl(prev!)}>
                    <ChevronLeft className="h-4 w-4" />
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span className="text-xs text-muted-foreground">Previous</span>
                      <span className="font-medium truncate">
                        {compact ? prev : prevTemplate.name}
                      </span>
                    </div>
                    {templateStatuses && (
                      <div className="ml-auto">
                        {getStatusIcon(templateStatuses[prev!])}
                      </div>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{prev} - {prevTemplate.name}</p>
                  <p className="text-xs text-muted-foreground">{prevTemplate.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className={cn('text-muted-foreground text-sm', compact && 'text-xs')}>
              First template
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex flex-col items-center shrink-0">
          <Badge variant="secondary" className="font-mono">
            {currentIndex + 1} / {total}
          </Badge>
          {!compact && (
            <span className="text-xs text-muted-foreground mt-0.5">templates</span>
          )}
        </div>

        {/* Next Button */}
        <div className="flex-1">
          {nextTemplate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={compact ? 'sm' : 'default'}
                  className="w-full justify-end gap-2"
                  asChild
                >
                  <Link href={getTemplateUrl(next!)}>
                    {templateStatuses && (
                      <div className="mr-auto">
                        {getStatusIcon(templateStatuses[next!])}
                      </div>
                    )}
                    <div className="flex flex-col items-end text-right min-w-0">
                      <span className="text-xs text-muted-foreground">Next</span>
                      <span className="font-medium truncate">
                        {compact ? next : nextTemplate.name}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{next} - {nextTemplate.name}</p>
                  <p className="text-xs text-muted-foreground">{nextTemplate.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className={cn('text-muted-foreground text-sm text-right', compact && 'text-xs')}>
              Last template
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Progress Bar Variant
// ============================================================================

export function TemplateProgressBar({
  currentTemplateId,
  templateStatuses,
  className,
}: Omit<TemplateNavigationProps, 'compact'>) {
  const { currentIndex, total } = getAdjacentTemplates(currentTemplateId);
  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        {/* Progress bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Template dots */}
        <div className="flex justify-between px-1">
          {TEMPLATE_ORDER.map((id, index) => {
            const template = ROI_TEMPLATES[id];
            const status = templateStatuses?.[id];
            const isCurrent = id === currentTemplateId;
            const isPast = index < currentIndex;

            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <Link
                    href={getTemplateUrl(id)}
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center transition-all',
                      isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      isPast && 'bg-primary',
                      !isPast && !isCurrent && 'bg-muted hover:bg-muted-foreground/20'
                    )}
                  >
                    {status && status.errorCount > 0 ? (
                      <AlertCircle className="h-2.5 w-2.5 text-destructive" />
                    ) : status && status.completeness >= 100 && status.rowCount > 0 ? (
                      <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                    ) : (
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isPast ? 'bg-primary-foreground' : 'bg-muted-foreground/50'
                        )}
                      />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="space-y-0.5">
                    <p className="font-medium">{id}</p>
                    <p className="text-xs text-muted-foreground">{template.name}</p>
                    {status && (
                      <p className="text-xs">
                        {status.rowCount} records · {status.completeness}% complete
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { TEMPLATE_ORDER, TEMPLATE_GROUPS, getAdjacentTemplates };
