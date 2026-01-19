'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Server,
  Lock,
  FileCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  Globe,
  Building2,
  Scale,
} from 'lucide-react';
import { Sparkline } from '@/components/ui/sparkline';
import type { Vendor, VendorWithRelations } from '@/lib/vendors/types';

// Risk factor types
interface RiskFactor {
  id: string;
  category: 'security' | 'compliance' | 'operational' | 'financial' | 'concentration';
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  issues: string[];
  lastUpdated: string;
}

interface ConcentrationRisk {
  type: 'geographic' | 'service' | 'infrastructure';
  name: string;
  exposure: number;
  threshold: number;
  status: 'safe' | 'warning' | 'critical';
  affectedVendors: number;
}

interface PredictiveInsight {
  type: 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  probability: number;
  timeframe: string;
  suggestedAction?: string;
}

interface VendorRiskIntelligenceProps {
  vendor: Vendor | VendorWithRelations;
  factors?: RiskFactor[];
  concentrationRisks?: ConcentrationRisk[];
  predictiveInsights?: PredictiveInsight[];
  historicalScores?: number[];
}

// Category icons
const categoryIcons = {
  security: Lock,
  compliance: FileCheck,
  operational: Server,
  financial: Scale,
  concentration: Building2,
};

const categoryColors = {
  security: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  compliance: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  operational: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  financial: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  concentration: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
};

// Generate mock data
function generateMockData(vendor: Vendor | VendorWithRelations): {
  factors: RiskFactor[];
  concentrationRisks: ConcentrationRisk[];
  predictiveInsights: PredictiveInsight[];
  historicalScores: number[];
} {
  const baseScore = vendor.risk_score ?? 60;

  const factors: RiskFactor[] = [
    {
      id: '1',
      category: 'security',
      name: 'Security Posture',
      score: Math.min(100, baseScore + 10),
      maxScore: 100,
      weight: 0.30,
      trend: baseScore > 60 ? 'up' : 'down',
      trendValue: 5,
      issues: baseScore < 60 ? ['Missing SOC 2 Type II', 'Penetration test overdue'] : [],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '2',
      category: 'compliance',
      name: 'Regulatory Compliance',
      score: vendor.lei ? Math.min(100, baseScore + 15) : Math.max(0, baseScore - 20),
      maxScore: 100,
      weight: 0.25,
      trend: vendor.lei ? 'up' : 'stable',
      trendValue: vendor.lei ? 8 : 0,
      issues: !vendor.lei ? ['LEI not verified', 'DORA assessment pending'] : [],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '3',
      category: 'operational',
      name: 'Operational Resilience',
      score: Math.min(100, baseScore + 5),
      maxScore: 100,
      weight: 0.20,
      trend: 'stable',
      trendValue: 0,
      issues: vendor.supports_critical_function && !vendor.critical_functions?.length
        ? ['Business continuity plan not reviewed', 'Recovery objectives undefined']
        : [],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '4',
      category: 'financial',
      name: 'Financial Stability',
      score: Math.min(100, baseScore + 12),
      maxScore: 100,
      weight: 0.15,
      trend: 'up',
      trendValue: 3,
      issues: [],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '5',
      category: 'concentration',
      name: 'Concentration Risk',
      score: vendor.tier === 'critical' ? Math.max(0, baseScore - 15) : baseScore,
      maxScore: 100,
      weight: 0.10,
      trend: vendor.tier === 'critical' ? 'down' : 'stable',
      trendValue: vendor.tier === 'critical' ? -5 : 0,
      issues: vendor.tier === 'critical' ? ['High dependency on single provider'] : [],
      lastUpdated: new Date().toISOString(),
    },
  ];

  const concentrationRisks: ConcentrationRisk[] = [
    {
      type: 'geographic',
      name: vendor.jurisdiction || 'Unknown Region',
      exposure: vendor.tier === 'critical' ? 45 : 20,
      threshold: 40,
      status: vendor.tier === 'critical' ? 'warning' : 'safe',
      affectedVendors: vendor.tier === 'critical' ? 3 : 1,
    },
    {
      type: 'service',
      name: vendor.provider_type?.replace(/_/g, ' ') || 'ICT Services',
      exposure: 30,
      threshold: 50,
      status: 'safe',
      affectedVendors: 5,
    },
    {
      type: 'infrastructure',
      name: 'Cloud Infrastructure',
      exposure: vendor.provider_type === 'cloud_service_provider' ? 55 : 25,
      threshold: 50,
      status: vendor.provider_type === 'cloud_service_provider' ? 'warning' : 'safe',
      affectedVendors: vendor.provider_type === 'cloud_service_provider' ? 4 : 2,
    },
  ];

  const predictiveInsights: PredictiveInsight[] = [];

  if (!vendor.last_assessment_date) {
    predictiveInsights.push({
      type: 'warning',
      title: 'Assessment Gap Risk',
      description: 'Without a recent assessment, compliance score may decline.',
      probability: 75,
      timeframe: '30 days',
      suggestedAction: 'Schedule DORA compliance assessment',
    });
  }

  if (vendor.tier === 'critical' && !vendor.monitoring_enabled) {
    predictiveInsights.push({
      type: 'warning',
      title: 'Monitoring Blind Spot',
      description: 'Critical vendor without continuous monitoring increases incident response time.',
      probability: 60,
      timeframe: '90 days',
      suggestedAction: 'Enable real-time monitoring',
    });
  }

  if (vendor.external_risk_grade && ['A', 'B'].includes(vendor.external_risk_grade)) {
    predictiveInsights.push({
      type: 'opportunity',
      title: 'Tier Upgrade Candidate',
      description: 'Strong performance metrics suggest potential for expanded partnership.',
      probability: 45,
      timeframe: '6 months',
    });
  }

  predictiveInsights.push({
    type: 'info',
    title: 'Regulatory Changes',
    description: 'DORA enforcement deadline approaching. Ensure all requirements are met.',
    probability: 100,
    timeframe: 'Jan 2025',
  });

  // Generate historical scores (last 12 months)
  const historicalScores: number[] = [];
  let currentScore = Math.max(30, baseScore - 15);
  for (let i = 0; i < 12; i++) {
    historicalScores.push(Math.round(currentScore));
    currentScore += (Math.random() - 0.3) * 5;
    currentScore = Math.max(30, Math.min(95, currentScore));
  }

  return { factors, concentrationRisks, predictiveInsights, historicalScores };
}

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function VendorRiskIntelligence({
  vendor,
  factors: providedFactors,
  concentrationRisks: providedConcentration,
  predictiveInsights: providedInsights,
  historicalScores: providedHistory,
}: VendorRiskIntelligenceProps) {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);

  const mockData = generateMockData(vendor);
  const factors = providedFactors || mockData.factors;
  const concentrationRisks = providedConcentration || mockData.concentrationRisks;
  const predictiveInsights = providedInsights || mockData.predictiveInsights;
  const historicalScores = providedHistory || mockData.historicalScores;

  // Calculate overall weighted score
  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight), 0)
  );

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className={cn('text-5xl font-bold', getScoreColor(overallScore))}>
                  {overallScore}
                </div>
                <div>
                  <p className="text-sm font-medium">Overall Risk Score</p>
                  <p className="text-xs text-muted-foreground">
                    Weighted across {factors.length} risk categories
                  </p>
                </div>
              </div>
            </div>
            <div className="w-48 h-16">
              <Sparkline
                data={historicalScores}
                color="auto"
                showEndpoint
                height={64}
              />
              <p className="text-xs text-muted-foreground text-center mt-1">12-month trend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="factors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="concentration">Concentration</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        {/* Risk Factors Tab */}
        <TabsContent value="factors" className="mt-4">
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {factors.map((factor) => {
                  const Icon = categoryIcons[factor.category];
                  const TrendIcon = factor.trend === 'up' ? TrendingUp : factor.trend === 'down' ? TrendingDown : Minus;
                  const isSelected = selectedFactor === factor.id;

                  return (
                    <div
                      key={factor.id}
                      className={cn(
                        'p-4 rounded-lg border transition-all cursor-pointer',
                        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      )}
                      onClick={() => setSelectedFactor(isSelected ? null : factor.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('p-2 rounded-lg', categoryColors[factor.category])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{factor.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={cn('font-bold', getScoreColor(factor.score))}>
                                {factor.score}
                              </span>
                              <span className="text-xs text-muted-foreground">/ {factor.maxScore}</span>
                              <TrendIcon
                                className={cn(
                                  'h-4 w-4',
                                  factor.trend === 'up' && 'text-emerald-600',
                                  factor.trend === 'down' && 'text-red-600',
                                  factor.trend === 'stable' && 'text-gray-400'
                                )}
                              />
                            </div>
                          </div>
                          <Progress
                            value={factor.score}
                            className={cn('h-2', `[&>div]:${getProgressColor(factor.score)}`)}
                          />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(factor.weight * 100)}% weight
                        </Badge>
                      </div>

                      {/* Expanded details */}
                      {isSelected && factor.issues.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Issues to Address
                          </p>
                          <ul className="space-y-1">
                            {factor.issues.map((issue, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <ChevronRight className="h-3 w-3" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Concentration Risk Tab */}
        <TabsContent value="concentration" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Concentration Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {concentrationRisks.map((risk, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{risk.type}</span>
                        <Badge variant="secondary">{risk.name}</Badge>
                      </div>
                      <Badge
                        className={cn(
                          risk.status === 'safe' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30',
                          risk.status === 'warning' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
                          risk.status === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900/30'
                        )}
                      >
                        {risk.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Exposure</span>
                        <span className="font-medium">{risk.exposure}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={risk.exposure} className="h-3" />
                        <div
                          className="absolute top-0 h-3 w-0.5 bg-red-500"
                          style={{ left: `${risk.threshold}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{risk.affectedVendors} vendor{risk.affectedVendors !== 1 ? 's' : ''}</span>
                        <span>Threshold: {risk.threshold}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Insights Tab */}
        <TabsContent value="predictive" className="mt-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Predictive Risk Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-lg border-l-4',
                      insight.type === 'warning' && 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
                      insight.type === 'opportunity' && 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
                      insight.type === 'info' && 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{insight.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        {insight.suggestedAction && (
                          <Button variant="link" className="h-auto p-0 mt-2 text-sm">
                            {insight.suggestedAction}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">{insight.probability}%</span>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Probability of occurrence</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground mt-1">{insight.timeframe}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
