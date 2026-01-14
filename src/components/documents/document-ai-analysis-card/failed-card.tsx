'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface FailedCardProps {
  error: string | null;
  isPending: boolean;
  onRetry: () => void;
}

export function FailedCard({ error, isPending, onRetry }: FailedCardProps) {
  return (
    <Card className="card-elevated border-destructive/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          Analysis Failed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Unknown error occurred'}</AlertDescription>
        </Alert>

        <Button
          onClick={onRetry}
          variant="outline"
          className="w-full gap-2"
          disabled={isPending}
        >
          <Sparkles className="h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
