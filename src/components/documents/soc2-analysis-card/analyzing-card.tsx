'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

interface AnalyzingCardProps {
  progress: number;
  statusMessage: string;
  isPolling: boolean;
}

const PROGRESS_STEPS = [
  { threshold: 10, label: 'Uploading to processing queue' },
  { threshold: 30, label: 'Extracting text from PDF' },
  { threshold: 60, label: 'AI analyzing controls & exceptions' },
  { threshold: 90, label: 'Mapping to DORA requirements' },
  { threshold: 100, label: 'Saving results' },
];

function ProgressStep({ threshold, label, currentProgress }: {
  threshold: number;
  label: string;
  currentProgress: number;
}) {
  const isComplete = currentProgress >= threshold;
  const previousThreshold = PROGRESS_STEPS.find(s => s.threshold === threshold)
    ? PROGRESS_STEPS[PROGRESS_STEPS.findIndex(s => s.threshold === threshold) - 1]?.threshold ?? 0
    : 0;
  const isActive = currentProgress >= previousThreshold && currentProgress < threshold;

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : isActive ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span>{label}</span>
    </div>
  );
}

export function AnalyzingCard({ progress, statusMessage, isPolling }: AnalyzingCardProps) {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Parsing SOC 2 Report...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {statusMessage && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
            <span className="text-sm">{statusMessage}</span>
          </div>
        )}

        <div className="space-y-2 text-sm">
          {PROGRESS_STEPS.map((step) => (
            <ProgressStep
              key={step.threshold}
              threshold={step.threshold}
              label={step.label}
              currentProgress={progress}
            />
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isPolling
            ? 'Processing via Modal.com - this may take a few minutes for large documents...'
            : 'Starting analysis...'}
        </p>
      </CardContent>
    </Card>
  );
}
