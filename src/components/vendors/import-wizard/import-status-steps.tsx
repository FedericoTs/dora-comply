'use client';

import { Loader2, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ImportResult } from './types';

interface ImportingStepProps {
  progress: number;
}

export function ImportingStep({ progress }: ImportingStepProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">Importing vendors...</p>
      <Progress value={progress} className="w-64" />
      <p className="text-sm text-muted-foreground">{progress}% complete</p>
    </div>
  );
}

interface CompleteStepProps {
  result: ImportResult;
}

export function CompleteStep({ result }: CompleteStepProps) {
  if (result.success > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-lg font-medium">Import Complete!</p>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{result.success}</p>
          <p className="text-sm text-muted-foreground">vendors imported successfully</p>
        </div>
        {result.failed > 0 && (
          <p className="text-sm text-amber-600">
            {result.failed} vendors failed to import
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <X className="h-8 w-8 text-red-600" />
      </div>
      <p className="text-lg font-medium">Import Failed</p>
      <p className="text-sm text-muted-foreground">
        No vendors were imported. Please check your data and try again.
      </p>
    </div>
  );
}
