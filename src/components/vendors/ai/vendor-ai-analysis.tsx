'use client';

import { useState, useEffect, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Lightbulb,
  BarChart3,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { Vendor, VendorWithRelations } from '@/lib/vendors/types';
import { fetchVendorAnalysis, type VendorAIAnalysis as ServerAnalysis } from '@/lib/vendors/actions';

interface AIAnalysisData {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionUrl?: string;
  }>;
  peerComparison: {
    percentile: number;
    avgIndustryScore: number;
    vendorScore: number;
    comparison: 'above' | 'at' | 'below';
  };
  riskTrend: {
    direction: 'improving' | 'stable' | 'declining';
    confidence: number;
    factors: string[];
  };
  generatedAt: string;
}

interface VendorAIAnalysisProps {
  vendor: Vendor | VendorWithRelations;
  analysis?: AIAnalysisData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Generate mock analysis based on vendor data
function generateMockAnalysis(vendor: Vendor | VendorWithRelations): AIAnalysisData {
  const hasLei = !!vendor.lei;
  const hasAssessment = !!vendor.last_assessment_date;
  const isCritical = vendor.supports_critical_function;
  const riskScore = vendor.risk_score ?? 50;

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (hasLei) strengths.push('Verified Legal Entity Identifier (LEI) on file');
  if (hasAssessment) strengths.push('Recent compliance assessment completed');
  if (vendor.monitoring_enabled) strengths.push('Continuous monitoring enabled');
  if (vendor.external_risk_grade && ['A', 'B'].includes(vendor.external_risk_grade)) {
    strengths.push(`Strong external risk rating (${vendor.external_risk_grade})`);
  }

  if (!hasLei) concerns.push('Missing Legal Entity Identifier (LEI)');
  if (!hasAssessment) concerns.push('No compliance assessment on record');
  if (isCritical && (!vendor.critical_functions?.length)) {
    concerns.push('Critical vendor without defined critical functions');
  }
  if (vendor.external_risk_grade && ['D', 'F'].includes(vendor.external_risk_grade)) {
    concerns.push(`Elevated external risk rating (${vendor.external_risk_grade})`);
  }
  if (!vendor.monitoring_enabled) concerns.push('Continuous monitoring not configured');

  // Ensure at least one of each
  if (strengths.length === 0) strengths.push('Active vendor relationship');
  if (concerns.length === 0) concerns.push('Consider scheduling periodic reviews');

  const recommendations = [];

  if (!hasLei) {
    recommendations.push({
      id: '1',
      priority: 'high' as const,
      title: 'Obtain LEI',
      description: 'Request the vendor\'s Legal Entity Identifier for DORA compliance.',
      actionUrl: `/vendors/${vendor.id}/edit`,
    });
  }

  if (!hasAssessment) {
    recommendations.push({
      id: '2',
      priority: 'high' as const,
      title: 'Complete Assessment',
      description: 'Conduct initial DORA compliance assessment.',
      actionUrl: `/vendors/${vendor.id}?tab=dora`,
    });
  }

  if (!vendor.monitoring_enabled) {
    recommendations.push({
      id: '3',
      priority: 'medium' as const,
      title: 'Enable Monitoring',
      description: 'Set up continuous risk monitoring for real-time alerts.',
      actionUrl: `/vendors/${vendor.id}?tab=monitoring`,
    });
  }

  if ('contracts_count' in vendor && vendor.contracts_count === 0) {
    recommendations.push({
      id: '4',
      priority: 'medium' as const,
      title: 'Upload Contracts',
      description: 'Add contract documents for compliance tracking.',
      actionUrl: `/vendors/${vendor.id}?tab=contracts`,
    });
  }

  // Peer comparison based on risk score
  const avgIndustryScore = 65;
  const comparison = riskScore > avgIndustryScore + 10 ? 'above' : riskScore < avgIndustryScore - 10 ? 'below' : 'at';
  const percentile = Math.min(95, Math.max(5, Math.round((riskScore / 100) * 100)));

  // Risk trend
  const trendDirection = riskScore >= 70 ? 'improving' : riskScore <= 40 ? 'declining' : 'stable';

  return {
    summary: `${vendor.name} is a ${vendor.tier} tier ${vendor.provider_type?.replace(/_/g, ' ') || 'service'} provider${isCritical ? ' supporting critical business functions' : ''}. ${hasAssessment ? 'Recent assessments show' : 'Initial analysis indicates'} ${riskScore >= 60 ? 'acceptable' : 'elevated'} risk levels with ${concerns.length > strengths.length ? 'areas requiring attention' : 'overall positive compliance posture'}.`,
    strengths,
    concerns,
    recommendations,
    peerComparison: {
      percentile,
      avgIndustryScore,
      vendorScore: riskScore,
      comparison,
    },
    riskTrend: {
      direction: trendDirection,
      confidence: 75,
      factors: trendDirection === 'improving'
        ? ['Completed recent assessment', 'Strong documentation']
        : trendDirection === 'declining'
        ? ['Missing certifications', 'No recent reviews']
        : ['Stable performance', 'Consistent compliance'],
    },
    generatedAt: new Date().toISOString(),
  };
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const trendIcons = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const trendColors = {
  improving: 'text-emerald-600',
  stable: 'text-gray-500',
  declining: 'text-red-600',
};

// Map server analysis to component format
function mapServerAnalysis(serverAnalysis: ServerAnalysis): AIAnalysisData {
  return {
    summary: serverAnalysis.summary,
    strengths: serverAnalysis.strengths.map(s => s.description),
    concerns: serverAnalysis.concerns.map(c => c.description),
    recommendations: serverAnalysis.recommendations.map(r => ({
      id: r.id,
      priority: r.priority === 'critical' ? 'high' : r.priority,
      title: r.title,
      description: r.description,
      actionUrl: r.actionHref,
    })),
    peerComparison: {
      percentile: serverAnalysis.peerComparison.tierComparison.percentile,
      avgIndustryScore: serverAnalysis.peerComparison.tierComparison.tierAverage,
      vendorScore: serverAnalysis.peerComparison.tierComparison.vendorScore || 0,
      comparison: serverAnalysis.peerComparison.tierComparison.verdict === 'above_average' ? 'above' :
                  serverAnalysis.peerComparison.tierComparison.verdict === 'below_average' ? 'below' : 'at',
    },
    riskTrend: {
      direction: serverAnalysis.riskPrediction.trend,
      confidence: serverAnalysis.riskPrediction.confidence === 'high' ? 85 :
                  serverAnalysis.riskPrediction.confidence === 'medium' ? 65 : 45,
      factors: serverAnalysis.riskPrediction.factors,
    },
    generatedAt: serverAnalysis.metadata.generatedAt,
  };
}

export function VendorAIAnalysis({
  vendor,
  analysis: providedAnalysis,
  isLoading: externalLoading = false,
  onRefresh,
}: VendorAIAnalysisProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(providedAnalysis || null);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(!!providedAnalysis);

  // Fetch real analysis on mount if not provided
  useEffect(() => {
    if (providedAnalysis) {
      setAnalysis(providedAnalysis);
      setHasLoaded(true);
      return;
    }

    startTransition(async () => {
      try {
        const serverAnalysis = await fetchVendorAnalysis(vendor.id);
        if (serverAnalysis) {
          setAnalysis(mapServerAnalysis(serverAnalysis));
        } else {
          // Fallback to mock if no analysis returned
          setAnalysis(generateMockAnalysis(vendor));
        }
      } catch (error) {
        console.error('Failed to fetch vendor analysis:', error);
        setAnalysis(generateMockAnalysis(vendor));
      } finally {
        setHasLoaded(true);
      }
    });
  }, [vendor.id, providedAnalysis, vendor]);

  const isLoading = externalLoading || (isPending && !hasLoaded);
  const displayAnalysis = analysis || generateMockAnalysis(vendor);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const serverAnalysis = await fetchVendorAnalysis(vendor.id);
      if (serverAnalysis) {
        setAnalysis(mapServerAnalysis(serverAnalysis));
      }
      await onRefresh?.();
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
    }
    setIsRefreshing(false);
  };

  const TrendIcon = trendIcons[displayAnalysis.riskTrend.direction];

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Analysis
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed">{displayAnalysis.summary}</p>
        </div>

        {/* Strengths & Concerns */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Strengths */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Strengths
            </h4>
            <ul className="space-y-1.5">
              {displayAnalysis.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-600 mt-0.5">+</span>
                  <span className="text-muted-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Concerns */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Concerns
            </h4>
            <ul className="space-y-1.5">
              {displayAnalysis.concerns.map((concern, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-600 mt-0.5">!</span>
                  <span className="text-muted-foreground">{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        {displayAnalysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {displayAnalysis.recommendations.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Badge className={cn('text-xs font-medium', priorityColors[rec.priority])}>
                    {rec.priority}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                  </div>
                  {rec.actionUrl && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Peer Comparison & Risk Trend */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Peer Comparison */}
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Peer Comparison
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Industry Percentile</span>
                <span className="font-medium">{displayAnalysis.peerComparison.percentile}th</span>
              </div>
              <Progress value={displayAnalysis.peerComparison.percentile} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {displayAnalysis.peerComparison.comparison === 'above'
                  ? `Performing above average (${displayAnalysis.peerComparison.avgIndustryScore} avg)`
                  : displayAnalysis.peerComparison.comparison === 'below'
                  ? `Performing below average (${displayAnalysis.peerComparison.avgIndustryScore} avg)`
                  : `Performing at industry average (${displayAnalysis.peerComparison.avgIndustryScore})`}
              </p>
            </div>
          </div>

          {/* Risk Trend */}
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendIcon className={cn('h-4 w-4', trendColors[displayAnalysis.riskTrend.direction])} />
              Risk Trend
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    'capitalize',
                    displayAnalysis.riskTrend.direction === 'improving' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    displayAnalysis.riskTrend.direction === 'stable' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                    displayAnalysis.riskTrend.direction === 'declining' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}
                >
                  {displayAnalysis.riskTrend.direction}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {displayAnalysis.riskTrend.confidence}% confidence
                </span>
              </div>
              <ul className="space-y-1">
                {displayAnalysis.riskTrend.factors.map((factor, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center">
          Analysis generated {new Date(displayAnalysis.generatedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </CardContent>
    </Card>
  );
}
