'use client';

import { AlertTriangle, Clock, ExternalLink, ShieldAlert, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SinglePointOfFailure } from '@/lib/concentration/types';

interface SpofDetectorProps {
  spofs: SinglePointOfFailure[];
  totalCriticalFunctions: number;
  className?: string;
}

function SpofCard({
  spof,
  index,
}: {
  spof: SinglePointOfFailure;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'rounded-lg border bg-card transition-all duration-200',
          'hover:shadow-md',
          isOpen && 'ring-1 ring-primary/20'
        )}
        style={{
          animationDelay: `${index * 50}ms`,
          animationFillMode: 'backwards',
        }}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-red-500/10">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{spof.vendor_name}</h4>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] uppercase',
                        spof.vendor_tier === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                        spof.vendor_tier === 'important' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      )}
                    >
                      {spof.vendor_tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sole provider for {spof.critical_functions.length} critical function{spof.critical_functions.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-red-500">Risk Score</p>
                  <p className="text-2xl font-bold">{spof.risk_score}</p>
                </div>
                <ChevronRight
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform',
                    isOpen && 'rotate-90'
                  )}
                />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t space-y-4 animate-in slide-in-from-top-2">
            {/* Critical Functions */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Affected Critical Functions
              </p>
              <div className="flex flex-wrap gap-2">
                {spof.critical_functions.map((func) => (
                  <Badge key={func} variant="outline" className="bg-muted/50">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recovery Estimate */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Estimated Recovery Time
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  {spof.recovery_time_estimate} to transition to an alternative provider
                </p>
              </div>
            </div>

            {/* Substitutability */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Substitutability Assessment
              </p>
              {spof.substitutability ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    spof.substitutability === 'not_substitutable' && 'bg-red-100 text-red-700',
                    spof.substitutability === 'substitutable_with_difficulty' && 'bg-orange-100 text-orange-700',
                    spof.substitutability === 'easily_substitutable' && 'bg-green-100 text-green-700'
                  )}
                >
                  {spof.substitutability.replace(/_/g, ' ')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Not Assessed
                </Badge>
              )}
            </div>

            {/* Recommended Actions */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Recommended Actions
              </p>
              <ul className="space-y-1.5">
                {spof.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button asChild size="sm" className="w-full">
                <Link href={`/vendors/${spof.vendor_id}`}>
                  View Vendor Profile
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function SpofDetector({
  spofs,
  totalCriticalFunctions,
  className,
}: SpofDetectorProps) {
  const affectedFunctions = new Set(spofs.flatMap((s) => s.critical_functions));
  const coveragePercentage =
    totalCriticalFunctions > 0
      ? Math.round((affectedFunctions.size / totalCriticalFunctions) * 100)
      : 0;

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">Single Points of Failure</h3>
              <p className="text-sm text-muted-foreground">
                Vendors with no backup for critical functions
              </p>
            </div>
          </div>
          {spofs.length > 0 && (
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {spofs.length}
            </Badge>
          )}
        </div>

        {/* Coverage Indicator */}
        {totalCriticalFunctions > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Functions at Risk</span>
              <span className="font-medium">
                {affectedFunctions.size} of {totalCriticalFunctions}
              </span>
            </div>
            <Progress
              value={coveragePercentage}
              className="h-2"
              // Use red color for the progress bar
              style={{
                '--progress-background': 'hsl(0 84% 60%)',
              } as React.CSSProperties}
            />
          </div>
        )}
      </div>

      {/* SPOF List */}
      <div className="p-4 space-y-3">
        {spofs.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <ShieldAlert className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-medium text-green-600 dark:text-green-400">
              No Single Points of Failure Detected
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All critical functions have backup vendor coverage
            </p>
          </div>
        ) : (
          spofs.map((spof, index) => (
            <SpofCard key={spof.vendor_id} spof={spof} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
