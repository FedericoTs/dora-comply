'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { ValidationError, RoiTemplateId } from '@/lib/roi/types';
import { ROI_TEMPLATES } from '@/lib/roi/types';

interface FixWizardProps {
  errors: ValidationError[];
  onRevalidate: () => void;
  isRevalidating: boolean;
}

interface Step {
  templateId: RoiTemplateId;
  errors: ValidationError[];
  completed: boolean;
}

export function FixWizard({ errors, onRevalidate, isRevalidating }: FixWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Group errors by template
  const errorsByTemplate = new Map<RoiTemplateId, ValidationError[]>();
  errors.forEach((error) => {
    if (!errorsByTemplate.has(error.templateId)) {
      errorsByTemplate.set(error.templateId, []);
    }
    errorsByTemplate.get(error.templateId)!.push(error);
  });

  const steps: Step[] = Array.from(errorsByTemplate.entries())
    .sort((a, b) => b[1].length - a[1].length) // Sort by error count
    .map(([templateId, templateErrors]) => ({
      templateId,
      errors: templateErrors,
      completed: completedSteps.has(templateId),
    }));

  const currentStep = steps[currentStepIndex];
  const progress = (completedSteps.size / steps.length) * 100;

  const markCompleted = () => {
    if (currentStep) {
      setCompletedSteps((prev) => new Set([...prev, currentStep.templateId]));
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const goToPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  if (steps.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="font-medium text-lg text-green-800">All Issues Resolved!</h3>
          <p className="text-green-700 mt-2">
            Your RoI data is ready for ESA submission.
          </p>
          <Button className="mt-4" onClick={onRevalidate} disabled={isRevalidating}>
            {isRevalidating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Verify Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Fix Wizard</CardTitle>
              <CardDescription>
                Step-by-step guide to resolve validation issues
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {completedSteps.size} / {steps.length} completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <Button
            key={step.templateId}
            variant={index === currentStepIndex ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentStepIndex(index)}
            className={cn(
              'flex-shrink-0',
              step.completed && index !== currentStepIndex && 'bg-green-100 text-green-800 border-green-200'
            )}
          >
            {step.completed && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {step.templateId}
            <Badge variant="secondary" className="ml-1 text-xs">
              {step.errors.length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Current Step Content */}
      {currentStep && (
        <Card className={cn(
          'border-2',
          currentStep.completed ? 'border-green-200' : 'border-primary/20'
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="font-mono">{currentStep.templateId}</span>
                  {currentStep.completed && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription>
                  {ROI_TEMPLATES[currentStep.templateId]?.name || 'Template'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/roi/${currentStep.templateId.toLowerCase().replace('.', '_')}`}
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Template
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Summary */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">
                  {currentStep.errors.filter((e) => e.severity === 'error').length} errors
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-600 font-medium">
                  {currentStep.errors.filter((e) => e.severity === 'warning').length} warnings
                </span>
              </div>
            </div>

            {/* Error List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currentStep.errors.map((error, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg text-sm',
                    error.severity === 'error' ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {error.columnCode}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Row {error.rowIndex + 1}</span>
                  </div>
                  <p>{error.message}</p>
                  {error.suggestion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: {error.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onRevalidate}
                  disabled={isRevalidating}
                >
                  {isRevalidating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Check Again
                </Button>
                {!currentStep.completed ? (
                  <Button onClick={markCompleted}>
                    Mark as Fixed
                    <CheckCircle2 className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={goToNext} disabled={currentStepIndex === steps.length - 1}>
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
