'use client';

/**
 * DORA Coverage Chart Component
 *
 * Displays DORA compliance coverage using a radar chart
 * Shows coverage by pillar: ICT Risk, Incident, Resilience, TPRM, Sharing
 */

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DORAcoverageByPillar {
  ICT_RISK: number;
  INCIDENT: number;
  TESTING: number;  // Renamed from RESILIENCE to match DORAPillar type
  TPRM: number;
  SHARING: number;
}

interface DORACoverageChartProps {
  coverage: DORAcoverageByPillar;
  overallScore: number;
  gaps: string[];
  className?: string;
  showLegend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PILLAR_LABELS: Record<keyof DORAcoverageByPillar, string> = {
  ICT_RISK: 'ICT Risk Management',
  INCIDENT: 'Incident Reporting',
  TESTING: 'Digital Resilience Testing',
  TPRM: 'Third-Party Risk',
  SHARING: 'Information Sharing',
};

const PILLAR_ARTICLES: Record<keyof DORAcoverageByPillar, string[]> = {
  ICT_RISK: ['Art. 5-16'],
  INCIDENT: ['Art. 17-23'],
  TESTING: ['Art. 24-27'],
  TPRM: ['Art. 28-44'],
  SHARING: ['Art. 45'],
};

export function DORACoverageChart({
  coverage,
  overallScore,
  gaps,
  className,
  showLegend = true,
  size = 'md',
}: DORACoverageChartProps) {
  // Transform data for radar chart
  const chartData = Object.entries(coverage).map(([pillar, score]) => ({
    pillar: PILLAR_LABELS[pillar as keyof DORAcoverageByPillar],
    shortName: pillar.replace('_', ' '),
    score: Math.round(score),
    fullMark: 100,
    articles: PILLAR_ARTICLES[pillar as keyof DORAcoverageByPillar].join(', '),
  }));

  const chartHeight = size === 'sm' ? 250 : size === 'md' ? 350 : 450;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Strong', variant: 'default' as const, className: 'bg-success' };
    if (score >= 50) return { label: 'Partial', variant: 'outline' as const, className: 'border-warning text-warning' };
    return { label: 'Gap', variant: 'destructive' as const, className: '' };
  };

  const overallBadge = getScoreBadge(overallScore);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">DORA Coverage Analysis</CardTitle>
            <CardDescription>
              Compliance mapping from SOC 2 controls to DORA pillars
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={cn('text-3xl font-bold', getScoreColor(overallScore))}>
              {Math.round(overallScore)}%
            </div>
            <Badge className={cn('mt-1', overallBadge.className)} variant={overallBadge.variant}>
              {overallBadge.label} Coverage
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Radar Chart */}
          <div className="flex-1" style={{ minHeight: chartHeight }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <PolarAngleAxis
                  dataKey="pillar"
                  tick={{
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickCount={5}
                  axisLine={false}
                />
                <Radar
                  name="Coverage %"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: 'hsl(var(--primary))',
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 6,
                    fill: 'hsl(var(--primary))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                  }}
                />
                {showLegend && <Legend />}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                          <p className="font-medium">{data.pillar}</p>
                          <p className="text-muted-foreground text-xs">{data.articles}</p>
                          <p className={cn('font-bold mt-1', getScoreColor(data.score))}>
                            {data.score}% Coverage
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Pillar Breakdown */}
          <div className="lg:w-64 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Coverage by Pillar
            </h4>
            {Object.entries(coverage).map(([pillar, score]) => {
              const badge = getScoreBadge(score);
              const isGap = gaps.some(g => g.includes(pillar));
              return (
                <div
                  key={pillar}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border',
                    isGap && 'border-destructive/50 bg-destructive/5'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {PILLAR_LABELS[pillar as keyof DORAcoverageByPillar]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {PILLAR_ARTICLES[pillar as keyof DORAcoverageByPillar].join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={cn('text-sm font-bold', getScoreColor(score))}>
                      {Math.round(score)}%
                    </span>
                    <Badge
                      variant={badge.variant}
                      className={cn('text-xs', badge.className)}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gaps Section */}
        {gaps.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-sm text-destructive uppercase tracking-wide mb-3">
              Identified Gaps ({gaps.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {gaps.map((gap) => (
                <Badge key={gap} variant="destructive" className="gap-1">
                  {gap}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
