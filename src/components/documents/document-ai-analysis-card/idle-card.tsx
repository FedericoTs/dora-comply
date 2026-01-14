'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, CheckCircle2 } from 'lucide-react';

interface IdleCardProps {
  isPending: boolean;
  onAnalyze: () => void;
}

export function IdleCard({ isPending, onAnalyze }: IdleCardProps) {
  return (
    <Card className="card-elevated border-dashed">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered DORA Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Extract DORA Provisions Automatically</p>
              <p className="text-sm text-muted-foreground mt-1">
                Claude AI will analyze this contract and extract all DORA Article 30
                provisions, identify compliance gaps, and flag risks.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  8 Article 30.2 provisions (all contracts)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  8 Article 30.3 provisions (critical functions)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Risk flags &amp; compliance gaps
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={onAnalyze}
          className="w-full gap-2"
          size="lg"
          disabled={isPending}
        >
          <Sparkles className="h-4 w-4" />
          Analyze with AI
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Analysis typically takes 15-30 seconds depending on document length
        </p>
      </CardContent>
    </Card>
  );
}
