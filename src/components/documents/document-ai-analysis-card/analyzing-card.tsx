'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

interface AnalyzingCardProps {
  progress: number;
}

export function AnalyzingCard({ progress }: AnalyzingCardProps) {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Analyzing Contract...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-2 text-sm">
          <ProgressStep
            isComplete={progress >= 20}
            isActive={progress < 20}
            label="Extracting text from PDF"
          />
          <ProgressStep
            isComplete={progress >= 80}
            isActive={progress >= 20 && progress < 80}
            isPending={progress < 20}
            label="Analyzing DORA Article 30 provisions"
          />
          <ProgressStep
            isComplete={false}
            isActive={progress >= 80}
            isPending={progress < 80}
            label="Identifying risks and gaps"
          />
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Claude is reading your contract and extracting DORA provisions...
        </p>
      </CardContent>
    </Card>
  );
}

interface ProgressStepProps {
  isComplete: boolean;
  isActive: boolean;
  isPending?: boolean;
  label: string;
}

function ProgressStep({ isComplete, isActive, label }: Omit<ProgressStepProps, 'isPending'>) {
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
