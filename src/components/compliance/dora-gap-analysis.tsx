'use client';

/**
 * DORA Gap Analysis Component
 *
 * Displays detailed gap analysis with:
 * - Article-level coverage status
 * - Evidence from SOC 2 controls
 * - Remediation recommendations
 */

import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { DORA_ARTICLES, PILLAR_LABELS, type DORAArticle } from '@/lib/dora';

// ============================================================================
// Types
// ============================================================================

export type CoverageStatus = 'covered' | 'partial' | 'gap';

export interface GapEvidence {
  controlId: string;
  controlName: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  mappingStrength: 'full' | 'partial' | 'none';
}

export interface GapAnalysisItem {
  article: DORAArticle;
  coverageStatus: CoverageStatus;
  coverageScore: number;
  evidence: GapEvidence[];
}

// ============================================================================
// Status Helpers
// ============================================================================

function getStatusIcon(status: CoverageStatus) {
  switch (status) {
    case 'covered':
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case 'partial':
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case 'gap':
      return <XCircle className="h-5 w-5 text-destructive" />;
  }
}

function getStatusBadge(status: CoverageStatus) {
  switch (status) {
    case 'covered':
      return <Badge className="bg-success">Covered</Badge>;
    case 'partial':
      return <Badge variant="outline" className="border-warning text-warning">Partial</Badge>;
    case 'gap':
      return <Badge variant="destructive">Gap</Badge>;
  }
}

// ============================================================================
// Evidence List Component
// ============================================================================

interface EvidenceListProps {
  evidence: GapEvidence[];
}

function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) return null;

  return (
    <div>
      <h5 className="text-xs font-medium uppercase text-muted-foreground mb-2 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        SOC 2 Evidence ({evidence.length} controls)
      </h5>
      <div className="flex flex-wrap gap-2">
        {evidence.map((ev) => (
          <Badge
            key={ev.controlId}
            variant={
              ev.testResult === 'operating_effectively'
                ? 'secondary'
                : ev.testResult === 'exception'
                  ? 'outline'
                  : 'secondary'
            }
            className={cn(
              'font-mono',
              ev.testResult === 'exception' && 'border-warning text-warning'
            )}
          >
            {ev.controlId}
            {ev.mappingStrength === 'partial' && ' (partial)'}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Requirements List Component
// ============================================================================

interface RequirementsListProps {
  requirements: readonly string[];
}

function RequirementsList({ requirements }: RequirementsListProps) {
  return (
    <div>
      <h5 className="text-xs font-medium uppercase text-muted-foreground mb-2 flex items-center gap-1">
        <FileText className="h-3 w-3" />
        Requirements
      </h5>
      <ul className="text-sm space-y-1">
        {requirements.map((req, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground">•</span>
            {req}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Remediation Panel Component
// ============================================================================

interface RemediationPanelProps {
  recommendations: readonly string[];
}

function RemediationPanel({ recommendations }: RemediationPanelProps) {
  return (
    <div className="bg-info/5 border border-info/20 rounded-lg p-3">
      <h5 className="text-xs font-medium uppercase text-info mb-2 flex items-center gap-1">
        <Lightbulb className="h-3 w-3" />
        Remediation Recommendations
      </h5>
      <ul className="text-sm space-y-1">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-info">→</span>
            {rec}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Article Accordion Component
// ============================================================================

interface ArticleAccordionProps {
  gap: GapAnalysisItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function ArticleAccordion({ gap, isExpanded, onToggle }: ArticleAccordionProps) {
  const articleInfo = DORA_ARTICLES[gap.article];

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={cn(
          'border rounded-lg overflow-hidden',
          gap.coverageStatus === 'gap' && 'border-destructive/50',
          gap.coverageStatus === 'partial' && 'border-warning/50'
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
            {getStatusIcon(gap.coverageStatus)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{gap.article}</span>
                <span className="text-muted-foreground truncate">
                  {articleInfo?.title}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={gap.coverageScore} className="h-1.5 w-24" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(gap.coverageScore)}%
                </span>
              </div>
            </div>
            {getStatusBadge(gap.coverageStatus)}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t bg-muted/20 space-y-4">
            {/* Article Description */}
            <p className="text-sm text-muted-foreground">
              {articleInfo?.description}
            </p>

            {/* Requirements */}
            {articleInfo?.requirements && (
              <RequirementsList requirements={articleInfo.requirements} />
            )}

            {/* SOC 2 Evidence */}
            <EvidenceList evidence={gap.evidence} />

            {/* Remediation Recommendations */}
            {gap.coverageStatus !== 'covered' && articleInfo?.remediation && (
              <RemediationPanel recommendations={articleInfo.remediation} />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// Main Gap Analysis Component
// ============================================================================

interface DORAGapAnalysisProps {
  gaps: GapAnalysisItem[];
  className?: string;
}

export function DORAGapAnalysis({ gaps, className }: DORAGapAnalysisProps) {
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

  const toggleArticle = (article: string) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(article)) {
      newExpanded.delete(article);
    } else {
      newExpanded.add(article);
    }
    setExpandedArticles(newExpanded);
  };

  // Group gaps by pillar
  const gapsByPillar = gaps.reduce<Record<string, GapAnalysisItem[]>>((acc, gap) => {
    const pillar = DORA_ARTICLES[gap.article]?.pillar || 'OTHER';
    if (!acc[pillar]) acc[pillar] = [];
    acc[pillar].push(gap);
    return acc;
  }, {});

  // Calculate summary stats
  const coveredCount = gaps.filter(g => g.coverageStatus === 'covered').length;
  const partialCount = gaps.filter(g => g.coverageStatus === 'partial').length;
  const gapCount = gaps.filter(g => g.coverageStatus === 'gap').length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-lg">DORA Compliance Gap Analysis</CardTitle>
        <CardDescription>
          Article-by-article analysis of DORA compliance based on SOC 2 control mapping
        </CardDescription>

        {/* Summary Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">{coveredCount} Covered</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">{partialCount} Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">{gapCount} Gaps</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.entries(gapsByPillar).map(([pillar, pillarGaps]) => (
          <div key={pillar} className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {PILLAR_LABELS[pillar as keyof typeof PILLAR_LABELS] || pillar}
            </h4>

            <div className="space-y-2">
              {pillarGaps.map((gap) => (
                <ArticleAccordion
                  key={gap.article}
                  gap={gap}
                  isExpanded={expandedArticles.has(gap.article)}
                  onToggle={() => toggleArticle(gap.article)}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Re-export types for convenience
export { DORA_ARTICLES, type DORAArticle };
