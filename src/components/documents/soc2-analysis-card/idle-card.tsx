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
          AI-Powered SOC 2 Parsing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                Extract Controls &amp; Evidence Automatically
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Claude AI will parse your SOC 2 report and extract all Trust
                Services Criteria controls, test results, and exceptions.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  64+ Trust Services Criteria controls (CC1-CC9)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Test results &amp; exceptions with impact
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Subservice organizations (4th party risk)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Automatic DORA compliance mapping
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
          Parse SOC 2 Report with AI
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Analysis typically takes 30-60 seconds depending on report length
        </p>
      </CardContent>
    </Card>
  );
}
