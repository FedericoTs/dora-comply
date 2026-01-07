'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Globe,
  Clock,
  Laptop,
  Server,
  Lock,
  Brain,
  MessageSquare,
  Key,
  Users,
} from 'lucide-react';
import { type SSCFactor, gradeToColor, scoreToGrade, FACTOR_DESCRIPTIONS } from '@/lib/external/securityscorecard-types';
import { cn } from '@/lib/utils';

interface FactorBreakdownProps {
  factors: SSCFactor[];
  className?: string;
}

const FACTOR_ICONS: Record<string, typeof Shield> = {
  network_security: Shield,
  dns_health: Globe,
  patching_cadence: Clock,
  endpoint_security: Laptop,
  ip_reputation: Server,
  application_security: Lock,
  cubit_score: Brain,
  hacker_chatter: MessageSquare,
  leaked_credentials: Key,
  social_engineering: Users,
};

const FACTOR_LABELS: Record<string, string> = {
  network_security: 'Network Security',
  dns_health: 'DNS Health',
  patching_cadence: 'Patching Cadence',
  endpoint_security: 'Endpoint Security',
  ip_reputation: 'IP Reputation',
  application_security: 'Application Security',
  cubit_score: 'Cubit Score',
  hacker_chatter: 'Hacker Chatter',
  leaked_credentials: 'Leaked Credentials',
  social_engineering: 'Social Engineering',
};

function getScoreColorClass(score: number): string {
  if (score >= 90) return 'text-success';
  if (score >= 80) return 'text-success/80';
  if (score >= 70) return 'text-warning';
  if (score >= 60) return 'text-warning/80';
  return 'text-error';
}

function FactorRow({ factor }: { factor: SSCFactor }) {
  const Icon = FACTOR_ICONS[factor.name] || Shield;
  const label = FACTOR_LABELS[factor.name] || factor.name;
  const description = FACTOR_DESCRIPTIONS[factor.name as keyof typeof FACTOR_DESCRIPTIONS] || '';
  const grade = scoreToGrade(factor.score);
  const gradeColor = gradeToColor(grade);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 py-2 group cursor-help">
            <div className="p-1.5 rounded bg-muted group-hover:bg-muted/80 transition-colors">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium truncate">{label}</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${gradeColor}20`, color: gradeColor }}
                  >
                    {grade}
                  </span>
                  <span className={cn('text-sm font-medium tabular-nums', getScoreColorClass(factor.score))}>
                    {factor.score}
                  </span>
                </div>
              </div>
              <Progress
                value={factor.score}
                className="h-1.5"
                style={
                  {
                    '--progress-foreground': gradeColor,
                  } as React.CSSProperties
                }
              />
            </div>
            {factor.issueCount > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {factor.issueCount} issue{factor.issueCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FactorBreakdown({ factors, className }: FactorBreakdownProps) {
  if (!factors || factors.length === 0) {
    return null;
  }

  // Sort factors by score (lowest first to highlight issues)
  const sortedFactors = [...factors].sort((a, b) => a.score - b.score);

  // Find weakest factors (score < 70)
  const weakFactors = sortedFactors.filter(f => f.score < 70);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Risk Factor Breakdown</CardTitle>
        {weakFactors.length > 0 && (
          <p className="text-xs text-warning">
            {weakFactors.length} factor{weakFactors.length !== 1 ? 's' : ''} below threshold
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="divide-y divide-border/50">
          {sortedFactors.map((factor) => (
            <FactorRow key={factor.name} factor={factor} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for overview
export function FactorSummary({ factors }: { factors: SSCFactor[] }) {
  if (!factors || factors.length === 0) {
    return null;
  }

  const weakFactors = factors.filter(f => f.score < 70);
  const avgScore = Math.round(factors.reduce((sum, f) => sum + f.score, 0) / factors.length);

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{factors.length} factors</span>
        <span className="text-muted-foreground">•</span>
        <span>Avg: {avgScore}</span>
      </div>
      {weakFactors.length > 0 && (
        <span className="text-warning text-xs">
          {weakFactors.length} issue{weakFactors.length !== 1 ? 's' : ''} detected
        </span>
      )}
    </div>
  );
}
