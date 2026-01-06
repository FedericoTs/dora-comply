'use client';

/**
 * Review & Complete Step (Step 5)
 *
 * Final review of onboarding progress before completing setup
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  Building,
  FileText,
  Layers,
  ArrowRight,
  Download,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WizardStep } from './wizard-step';
import { cn } from '@/lib/utils';
import type { OnboardingStepData, WizardStepId } from '@/lib/roi/onboarding-types';

interface ReviewStepProps {
  validation?: OnboardingStepData;
  onBack?: () => void;
  onComplete?: () => void;
}

interface SetupSummary {
  entityComplete: boolean;
  entityName: string;
  vendorCount: number;
  vendorsWithLei: number;
  contractCount: number;
  functionCount: number;
  criticalFunctions: number;
  templatesReady: number;
  totalTemplates: number;
  overallProgress: number;
}

export function ReviewStep({ validation, onBack, onComplete }: ReviewStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SetupSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // Load summary data
  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch('/api/roi/onboarding/summary');
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        } else {
          // Mock data for development
          setSummary({
            entityComplete: true,
            entityName: 'Your Organization',
            vendorCount: 5,
            vendorsWithLei: 3,
            contractCount: 4,
            functionCount: 3,
            criticalFunctions: 2,
            templatesReady: 8,
            totalTemplates: 15,
            overallProgress: 53,
          });
        }
      } catch (error) {
        console.error('Failed to load summary:', error);
        // Use mock data on error
        setSummary({
          entityComplete: false,
          entityName: '',
          vendorCount: 0,
          vendorsWithLei: 0,
          contractCount: 0,
          functionCount: 0,
          criticalFunctions: 0,
          templatesReady: 0,
          totalTemplates: 15,
          overallProgress: 0,
        });
      } finally {
        setIsLoadingSummary(false);
      }
    }
    loadSummary();
  }, []);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/roi/onboarding/complete', {
        method: 'POST',
      });
      onComplete?.();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (isComplete: boolean) => {
    return isComplete ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-amber-500" />
    );
  };

  if (isLoadingSummary) {
    return (
      <WizardStep
        stepId={5 as WizardStepId}
        title="Review & Complete"
        description="Loading your setup summary..."
        icon={<CheckCircle2 className="h-6 w-6" />}
        isLoading={true}
        isLastStep
        onBack={onBack}
      >
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </WizardStep>
    );
  }

  return (
    <WizardStep
      stepId={5 as WizardStepId}
      title="Review & Complete"
      description="Review your Register of Information setup before proceeding"
      icon={<CheckCircle2 className="h-6 w-6" />}
      validation={validation}
      isLoading={isLoading}
      isLastStep
      onBack={onBack}
      onComplete={handleComplete}
    >
      <div className="space-y-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall RoI Readiness</CardTitle>
            <CardDescription>
              Based on your setup progress and data completeness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={summary?.overallProgress || 0} className="flex-1 h-3" />
              <span className="text-2xl font-bold text-primary">
                {summary?.overallProgress || 0}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {summary?.templatesReady || 0} of {summary?.totalTemplates || 15} templates have data
            </p>
          </CardContent>
        </Card>

        {/* Setup Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Entity */}
          <Card className={cn(!summary?.entityComplete && 'border-amber-200')}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">Entity Information</h4>
                    {getStatusIcon(summary?.entityComplete || false)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {summary?.entityComplete
                      ? summary.entityName
                      : 'Missing required fields'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendors */}
          <Card className={cn((summary?.vendorCount || 0) === 0 && 'border-amber-200')}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">ICT Providers</h4>
                    {getStatusIcon((summary?.vendorCount || 0) > 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {summary?.vendorCount || 0} vendors ({summary?.vendorsWithLei || 0} with LEI)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card className={cn((summary?.contractCount || 0) === 0 && 'border-amber-200')}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">Contracts</h4>
                    {getStatusIcon((summary?.contractCount || 0) > 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {summary?.contractCount || 0} contractual arrangements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Functions */}
          <Card className={cn((summary?.functionCount || 0) === 0 && 'border-amber-200')}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">Functions</h4>
                    {getStatusIcon((summary?.functionCount || 0) > 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {summary?.functionCount || 0} functions ({summary?.criticalFunctions || 0} critical)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Continue adding data</p>
                <p className="text-xs text-muted-foreground">
                  Fill in remaining fields to improve your RoI completeness
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Review validation errors</p>
                <p className="text-xs text-muted-foreground">
                  Fix any issues flagged by our validation engine
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Export your RoI package</p>
                <p className="text-xs text-muted-foreground">
                  Generate the xBRL-CSV files for ESA submission
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions After Completion */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href="/roi">
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to RoI Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/roi/export">
              <Download className="mr-2 h-4 w-4" />
              Preview Export
            </Link>
          </Button>
        </div>
      </div>
    </WizardStep>
  );
}
