'use client';

/**
 * Vendor Assessment Progress Component
 *
 * Shows completion status for vendor assessment workflow.
 * Guides users on what steps are complete and what's still needed.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AssessmentStep {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  isRequired: boolean;
  tabId?: string;
  href?: string;
}

interface AssessmentProgressProps {
  vendorId: string;
  vendorName: string;
  // Completion data
  hasContacts: boolean;
  hasDocuments: boolean;
  hasContracts: boolean;
  hasParsedSoc2: boolean;
  hasLei: boolean;
  leiVerified: boolean;
  hasMonitoring: boolean;
  isCritical: boolean;
  className?: string;
}

export function AssessmentProgress({
  vendorId,
  vendorName,
  hasContacts,
  hasDocuments,
  hasContracts,
  hasParsedSoc2,
  hasLei,
  leiVerified,
  hasMonitoring,
  isCritical,
  className,
}: AssessmentProgressProps) {
  const steps = useMemo<AssessmentStep[]>(() => [
    {
      id: 'basic',
      label: 'Basic Information',
      description: 'Vendor profile created',
      isComplete: true, // Always complete if vendor exists
      isRequired: true,
      tabId: 'overview',
    },
    {
      id: 'contacts',
      label: 'Contact Information',
      description: 'Add at least one vendor contact',
      isComplete: hasContacts,
      isRequired: true,
      tabId: 'contacts',
    },
    {
      id: 'documents',
      label: 'Compliance Documents',
      description: 'Upload SOC 2 report or other compliance docs',
      isComplete: hasDocuments,
      isRequired: true,
      tabId: 'documents',
    },
    {
      id: 'soc2',
      label: 'SOC 2 Analysis',
      description: 'Parse SOC 2 report for DORA mapping',
      isComplete: hasParsedSoc2,
      isRequired: isCritical,
      tabId: 'dora',
    },
    {
      id: 'contracts',
      label: 'Contract Records',
      description: 'Link contracts with exit clauses and terms',
      isComplete: hasContracts,
      isRequired: isCritical,
      tabId: 'contracts',
    },
    {
      id: 'enrichment',
      label: 'Data Enrichment',
      description: hasLei
        ? (leiVerified ? 'LEI verified via GLEIF' : 'LEI added, verification pending')
        : 'Add LEI for regulatory data enrichment',
      isComplete: hasLei && leiVerified,
      isRequired: false,
      tabId: 'enrichment',
    },
    {
      id: 'monitoring',
      label: 'Continuous Monitoring',
      description: 'Set up external risk monitoring',
      isComplete: hasMonitoring,
      isRequired: isCritical,
      tabId: 'monitoring',
    },
  ], [hasContacts, hasDocuments, hasContracts, hasParsedSoc2, hasLei, leiVerified, hasMonitoring, isCritical]);

  const requiredSteps = steps.filter(s => s.isRequired);
  const completedRequired = requiredSteps.filter(s => s.isComplete).length;
  const totalRequired = requiredSteps.length;
  const completionPercentage = Math.round((completedRequired / totalRequired) * 100);

  const completedTotal = steps.filter(s => s.isComplete).length;
  const totalSteps = steps.length;

  // Find first incomplete required step
  const nextStep = steps.find(s => s.isRequired && !s.isComplete) || steps.find(s => !s.isComplete);

  const isFullyComplete = completedRequired === totalRequired;

  return (
    <Card className={cn('card-elevated', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isFullyComplete ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning" />
            )}
            Assessment Progress
          </CardTitle>
          <span className="text-2xl font-bold">
            {completionPercentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completedRequired} of {totalRequired} required steps complete
            {completedTotal > completedRequired && ` (${completedTotal}/${totalSteps} total)`}
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={`/vendors/${vendorId}?tab=${step.tabId}`}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                step.isComplete
                  ? 'text-muted-foreground hover:bg-muted/50'
                  : 'hover:bg-muted'
              )}
            >
              {step.isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              ) : (
                <Circle className={cn(
                  'h-4 w-4 flex-shrink-0',
                  step.isRequired ? 'text-warning' : 'text-muted-foreground'
                )} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    step.isComplete && 'line-through'
                  )}>
                    {step.label}
                  </span>
                  {step.isRequired && !step.isComplete && (
                    <span className="text-xs px-1.5 py-0.5 bg-warning/10 text-warning rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Next Step CTA */}
        {nextStep && !isFullyComplete && (
          <div className="pt-2 border-t">
            <Button size="sm" className="w-full" asChild>
              <Link href={`/vendors/${vendorId}?tab=${nextStep.tabId}`}>
                Continue: {nextStep.label}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {isFullyComplete && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Assessment Complete</p>
                <p className="text-xs text-muted-foreground">
                  All required steps for {vendorName} have been completed.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
