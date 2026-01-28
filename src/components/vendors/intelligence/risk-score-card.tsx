'use client';

import { useState } from 'react';
import {
  Newspaper,
  ShieldAlert,
  FileText,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { IntelligenceSeverity } from '@/lib/intelligence/types';

// =============================================================================
// TYPES
// =============================================================================

interface RiskScoreData {
  composite: number;
  level: IntelligenceSeverity;
  trend: 'improving' | 'stable' | 'degrading';
  trendChange: number;
  components: {
    news: number;
    breach: number;
    filing: number;
    cyber: number;
  };
  weights: {
    news: number;
    breach: number;
    filing: number;
    cyber: number;
  };
  criticalAlerts: number;
  highAlerts: number;
  unresolvedAlerts: number;
  lastCalculated?: string;
}

interface RiskScoreCardProps {
  score: RiskScoreData | null;
  vendorName: string;
  isLoading?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RISK_COLORS: Record<IntelligenceSeverity, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500' },
  medium: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
  high: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
  critical: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' },
};

const COMPONENT_INFO = {
  news: {
    label: 'News Risk',
    icon: Newspaper,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    description: 'Risk from news sentiment, regulatory mentions, and market events',
  },
  breach: {
    label: 'Breach Exposure',
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    description: 'Risk from data breaches and security incidents (HIBP)',
  },
  filing: {
    label: 'SEC Filing Risk',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    description: 'Risk from SEC filings, 8-K material events, financial disclosures',
  },
  cyber: {
    label: 'Cyber Risk',
    icon: Shield,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500',
    description: 'External cyber risk rating (SecurityScorecard)',
  },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function RiskGauge({ score, level }: { score: number; level: IntelligenceSeverity }) {
  const colors = RISK_COLORS[level];
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="relative w-48 h-24 mx-auto">
      {/* Background arc */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="w-48 h-48 rounded-full border-8 border-gray-200"
          style={{
            clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
            transform: 'rotate(180deg)',
          }}
        />
      </div>

      {/* Colored segments */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Low segment (0-25) - Green */}
        <div
          className="absolute w-48 h-48 rounded-full border-8 border-emerald-500"
          style={{
            clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)',
            transform: 'rotate(180deg)',
          }}
        />
        {/* Medium segment (25-50) - Yellow */}
        <div
          className="absolute w-48 h-48 rounded-full border-8 border-yellow-500"
          style={{
            clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)',
            transform: 'rotate(225deg)',
          }}
        />
        {/* High segment (50-75) - Orange */}
        <div
          className="absolute w-48 h-48 rounded-full border-8 border-orange-500"
          style={{
            clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)',
            transform: 'rotate(270deg)',
          }}
        />
        {/* Critical segment (75-100) - Red */}
        <div
          className="absolute w-48 h-48 rounded-full border-8 border-red-500"
          style={{
            clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)',
            transform: 'rotate(315deg)',
          }}
        />
      </div>

      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom transition-transform duration-500"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-800" />
      </div>

      {/* Center cover */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-gray-800" />

      {/* Score display */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
        <span className={cn('text-4xl font-bold', colors.text)}>{Math.round(score)}</span>
        <span className="text-gray-400 text-lg">/100</span>
      </div>
    </div>
  );
}

function ComponentBar({
  component,
  score,
  weight,
}: {
  component: keyof typeof COMPONENT_INFO;
  score: number;
  weight: number;
}) {
  const info = COMPONENT_INFO[component];
  const Icon = info.icon;
  const weightedContribution = score * weight;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', info.color)} />
                <span className="font-medium">{info.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">
                  {Math.round(score)} × {(weight * 100).toFixed(0)}%
                </span>
                <span className="font-semibold w-8 text-right">
                  {weightedContribution.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', info.bgColor)}
                style={{ width: `${score}%`, opacity: 0.7 + (weight * 0.3) }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="font-medium">{info.label}</p>
          <p className="text-xs text-gray-500 mt-1">{info.description}</p>
          <div className="mt-2 text-xs">
            <p>Raw Score: <span className="font-medium">{Math.round(score)}/100</span></p>
            <p>Weight: <span className="font-medium">{(weight * 100).toFixed(0)}%</span></p>
            <p>Contribution: <span className="font-medium">{weightedContribution.toFixed(1)} points</span></p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TrendIndicator({ trend, change }: { trend: 'improving' | 'stable' | 'degrading'; change: number }) {
  if (trend === 'improving') {
    return (
      <div className="flex items-center gap-1 text-emerald-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">
          {Math.abs(change).toFixed(1)} pts better
        </span>
      </div>
    );
  }
  if (trend === 'degrading') {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">
          {Math.abs(change).toFixed(1)} pts worse
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">Stable</span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RiskScoreCard({ score, vendorName, isLoading }: RiskScoreCardProps) {
  const [showFormula, setShowFormula] = useState(false);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No Risk Score Yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click &ldquo;Sync Now&rdquo; to calculate the intelligence risk score
          </p>
        </CardContent>
      </Card>
    );
  }

  const colors = RISK_COLORS[score.level];
  const weights = score.weights || { news: 0.20, breach: 0.35, filing: 0.15, cyber: 0.30 };

  return (
    <Card className={cn('border-2', colors.border)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Intelligence Risk Score
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      Composite risk score calculated from multiple intelligence sources.
                      Higher score = Higher risk. Updated on each sync.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <p className="text-sm text-gray-500">
              {vendorName} • Last updated:{' '}
              {score.lastCalculated
                ? new Date(score.lastCalculated).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-sm px-3 py-1 capitalize',
              score.level === 'critical' && 'bg-red-50 text-red-700 border-red-300',
              score.level === 'high' && 'bg-orange-50 text-orange-700 border-orange-300',
              score.level === 'medium' && 'bg-yellow-50 text-yellow-700 border-yellow-300',
              score.level === 'low' && 'bg-emerald-50 text-emerald-700 border-emerald-300'
            )}
          >
            {score.level === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {score.level === 'low' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {score.level} Risk
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <RiskGauge score={score.composite} level={score.level} />
          </div>

          <div className="flex-1 space-y-3 pl-6 border-l">
            {/* Trend */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trend</p>
              <TrendIndicator trend={score.trend} change={score.trendChange} />
            </div>

            {/* Alert Counts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Critical</p>
                <p className={cn(
                  'text-xl font-bold',
                  score.criticalAlerts > 0 ? 'text-red-600' : 'text-gray-400'
                )}>
                  {score.criticalAlerts}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">High</p>
                <p className={cn(
                  'text-xl font-bold',
                  score.highAlerts > 0 ? 'text-orange-600' : 'text-gray-400'
                )}>
                  {score.highAlerts}
                </p>
              </div>
            </div>

            {/* Unresolved */}
            {score.unresolvedAlerts > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                <p className="text-xs text-amber-800 font-medium">
                  {score.unresolvedAlerts} unresolved alert{score.unresolvedAlerts > 1 ? 's' : ''} requiring action
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFormula(!showFormula)}
            className="w-full flex items-center justify-between text-gray-600 hover:text-gray-900"
          >
            <span className="font-medium">Score Breakdown</span>
            {showFormula ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showFormula && (
            <div className="mt-4 space-y-4">
              {/* Formula explanation */}
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-500 mb-2">// Risk Score Formula</p>
                <p className="text-gray-700">
                  <span className="text-purple-600">compositeScore</span> ={' '}
                  <span className="text-blue-600">(news × {(weights.news * 100).toFixed(0)}%)</span> +{' '}
                  <span className="text-red-600">(breach × {(weights.breach * 100).toFixed(0)}%)</span> +{' '}
                  <span className="text-purple-600">(filing × {(weights.filing * 100).toFixed(0)}%)</span> +{' '}
                  <span className="text-cyan-600">(cyber × {(weights.cyber * 100).toFixed(0)}%)</span>
                </p>
                <p className="text-gray-500 mt-2 text-xs">
                  + temporal decay (recent alerts weighted more) + critical escalation (+15-30%)
                </p>
              </div>

              {/* Component bars */}
              <div className="space-y-3">
                <ComponentBar component="news" score={score.components.news} weight={weights.news} />
                <ComponentBar component="breach" score={score.components.breach} weight={weights.breach} />
                <ComponentBar component="filing" score={score.components.filing} weight={weights.filing} />
                <ComponentBar component="cyber" score={score.components.cyber} weight={weights.cyber} />
              </div>

              {/* Calculation summary */}
              <div className="flex items-center justify-between bg-gray-900 text-white rounded-lg p-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Weighted Sum</p>
                  <p className="font-mono">
                    {(score.components.news * weights.news).toFixed(1)} +{' '}
                    {(score.components.breach * weights.breach).toFixed(1)} +{' '}
                    {(score.components.filing * weights.filing).toFixed(1)} +{' '}
                    {(score.components.cyber * weights.cyber).toFixed(1)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Final Score</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {score.composite.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
