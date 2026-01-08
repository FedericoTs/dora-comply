'use client';

/**
 * Framework Comparison Chart Component
 *
 * Multi-series radar chart showing compliance across all 4 frameworks.
 * Includes cross-framework coverage analysis table.
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FrameworkCode, FrameworkComplianceResult } from '@/lib/compliance/framework-types';
import {
  calculateCrossFrameworkCoverage,
  getFrameworkOverlapSummary,
} from '@/lib/compliance/mappings';

interface FrameworkComparisonChartProps {
  results: Record<FrameworkCode, FrameworkComplianceResult>;
  className?: string;
}

// Framework display configuration
const FRAMEWORK_CONFIG: Record<FrameworkCode, { name: string; color: string; shortName: string }> = {
  dora: { name: 'DORA', color: 'hsl(var(--primary))', shortName: 'DORA' },
  nis2: { name: 'NIS2 Directive', color: '#3B82F6', shortName: 'NIS2' },
  gdpr: { name: 'GDPR Art. 32', color: '#10B981', shortName: 'GDPR' },
  iso27001: { name: 'ISO 27001', color: '#8B5CF6', shortName: 'ISO' },
};

// Unified categories for comparison (mapped across frameworks)
const COMPARISON_CATEGORIES = [
  { id: 'governance', label: 'Governance', shortLabel: 'Gov' },
  { id: 'risk_management', label: 'Risk Management', shortLabel: 'Risk' },
  { id: 'incident', label: 'Incident Handling', shortLabel: 'Incident' },
  { id: 'access_control', label: 'Access Control', shortLabel: 'Access' },
  { id: 'business_continuity', label: 'Business Continuity', shortLabel: 'BC' },
  { id: 'third_party', label: 'Third-Party Risk', shortLabel: 'TPRM' },
];

// Map framework categories to unified categories
const CATEGORY_MAPPING: Record<FrameworkCode, Record<string, string>> = {
  dora: {
    'ICT_RISK': 'risk_management',
    'INCIDENT': 'incident',
    'TESTING': 'business_continuity',
    'TPRM': 'third_party',
    'SHARING': 'governance',
  },
  nis2: {
    'governance': 'governance',
    'risk_management': 'risk_management',
    'incident_handling': 'incident',
    'access_control': 'access_control',
    'business_continuity': 'business_continuity',
    'supply_chain': 'third_party',
  },
  gdpr: {
    'technical_measures': 'access_control',
    'organizational_measures': 'governance',
    'resilience': 'business_continuity',
  },
  iso27001: {
    'organizational_controls': 'governance',
    'people_controls': 'access_control',
    'physical_controls': 'risk_management',
    'technological_controls': 'incident',
  },
};

export function FrameworkComparisonChart({ results, className }: FrameworkComparisonChartProps) {
  const frameworks = Object.keys(results) as FrameworkCode[];

  // Build chart data with scores per unified category
  const chartData = COMPARISON_CATEGORIES.map((category) => {
    const dataPoint: Record<string, string | number> = {
      category: category.label,
      shortLabel: category.shortLabel,
    };

    for (const fw of frameworks) {
      const result = results[fw];
      if (result && result.category_scores) {
        // Find matching category score
        let score = 0;
        let matchCount = 0;

        for (const [catCode, catScore] of Object.entries(result.category_scores)) {
          const mappedCategory = CATEGORY_MAPPING[fw]?.[catCode];
          if (mappedCategory === category.id) {
            score += catScore.score;
            matchCount++;
          }
        }

        dataPoint[fw] = matchCount > 0 ? Math.round(score / matchCount) : result.overall_score;
      } else {
        dataPoint[fw] = 0;
      }
    }

    return dataPoint;
  });

  // Calculate cross-framework coverage
  const crossCoverage: Array<{
    source: FrameworkCode;
    target: FrameworkCode;
    coverage: number;
    mappings: number;
  }> = [];

  for (const source of frameworks) {
    for (const target of frameworks) {
      if (source !== target) {
        const coverage = calculateCrossFrameworkCoverage(
          source,
          target,
          results[source]?.overall_score ?? 0
        );
        const overlap = getFrameworkOverlapSummary(source, target);
        crossCoverage.push({
          source,
          target,
          coverage,
          mappings: overlap.total_mappings,
        });
      }
    }
  }

  // Get overall scores for summary
  const overallScores = frameworks.map((fw) => ({
    framework: fw,
    score: results[fw]?.overall_score ?? 0,
    status: results[fw]?.status ?? 'not_assessed',
  }));

  const avgScore = Math.round(
    overallScores.reduce((sum, s) => sum + s.score, 0) / overallScores.length
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Radar Comparison Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Framework Comparison</CardTitle>
              <CardDescription>
                Compliance scores across DORA, NIS2, GDPR, and ISO 27001
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={cn(
                'text-3xl font-bold',
                avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-600'
              )}>
                {avgScore}%
              </div>
              <p className="text-xs text-muted-foreground">Average Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Radar Chart */}
            <div className="flex-1" style={{ minHeight: 400 }}>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                  <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="shortLabel"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
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

                  {/* One Radar per framework */}
                  {frameworks.map((fw) => (
                    <Radar
                      key={fw}
                      name={FRAMEWORK_CONFIG[fw].name}
                      dataKey={fw}
                      stroke={FRAMEWORK_CONFIG[fw].color}
                      fill={FRAMEWORK_CONFIG[fw].color}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      dot={{ r: 3, fill: FRAMEWORK_CONFIG[fw].color, strokeWidth: 0 }}
                    />
                  ))}

                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                            <p className="font-medium mb-2">{label}</p>
                            <div className="space-y-1">
                              {payload.map((entry) => (
                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span>{entry.name}</span>
                                  </div>
                                  <span className="font-semibold">{entry.value}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Framework Scores Summary */}
            <div className="xl:w-64 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Overall Scores
              </h4>
              {overallScores.map(({ framework, score, status }) => {
                const config = FRAMEWORK_CONFIG[framework];
                return (
                  <div
                    key={framework}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="font-medium text-sm">{config.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-bold',
                          score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'
                        )}
                      >
                        {score}%
                      </span>
                      {status === 'compliant' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : status === 'partially_compliant' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cross-Framework Coverage Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Cross-Framework Coverage</CardTitle>
          <CardDescription>
            How compliance in one framework contributes to others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">From Framework</TableHead>
                <TableHead className="w-[50px]" />
                <TableHead className="w-[200px]">To Framework</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
                <TableHead className="text-right">Mappings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crossCoverage
                .filter((c) => c.mappings > 0)
                .sort((a, b) => b.coverage - a.coverage)
                .slice(0, 8)
                .map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: FRAMEWORK_CONFIG[row.source].color }}
                        />
                        <span className="font-medium">{FRAMEWORK_CONFIG[row.source].name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: FRAMEWORK_CONFIG[row.target].color }}
                        />
                        <span>{FRAMEWORK_CONFIG[row.target].name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-mono',
                          row.coverage >= 70 && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                          row.coverage >= 40 && row.coverage < 70 && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                          row.coverage < 40 && 'bg-slate-500/10 text-slate-600 border-slate-500/30'
                        )}
                      >
                        {row.coverage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.mappings} controls
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {crossCoverage.filter((c) => c.mappings > 0).length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No cross-framework mappings available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
