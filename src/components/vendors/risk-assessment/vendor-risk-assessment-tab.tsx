'use client';

/**
 * Vendor Risk Assessment Tab
 *
 * Displays multi-domain risk assessments for a vendor
 * Allows viewing and starting assessments across different risk domains
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Lock,
  Scale,
  Settings,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DomainAssessmentSheet } from './domain-assessment-sheet';
import type {
  RiskDomainWithCriteria,
  VendorDomainAssessmentWithDetails,
  RiskLevel,
  AssessmentStatus,
} from '@/lib/domain-assessments/types';

interface VendorRiskAssessmentTabProps {
  vendorId: string;
  vendorName: string;
  organizationId: string;
}

// Map domain names to icons
const domainIcons: Record<string, React.ElementType> = {
  Security: Shield,
  Privacy: Lock,
  Compliance: Scale,
  Operational: Settings,
  Financial: DollarSign,
};

// Risk level badge variants
const riskLevelVariant: Record<RiskLevel, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  low: 'default',
  medium: 'secondary',
  high: 'outline',
  critical: 'destructive',
};

const riskLevelColors: Record<RiskLevel, string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-orange-500',
  critical: 'text-error',
};

const statusConfig: Record<AssessmentStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Not Started', color: 'text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-500', icon: Play },
  completed: { label: 'Completed', color: 'text-success', icon: CheckCircle2 },
  needs_review: { label: 'Needs Review', color: 'text-warning', icon: AlertTriangle },
};

export function VendorRiskAssessmentTab({
  vendorId,
  vendorName,
  organizationId,
}: VendorRiskAssessmentTabProps) {
  const [domains, setDomains] = useState<RiskDomainWithCriteria[]>([]);
  const [assessments, setAssessments] = useState<VendorDomainAssessmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<RiskDomainWithCriteria | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<VendorDomainAssessmentWithDetails | null>(null);

  // Fetch domains and assessments
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      try {
        // Fetch risk domains
        const { data: domainsData } = await supabase
          .from('risk_domains')
          .select('*')
          .or(`organization_id.eq.${organizationId},organization_id.is.null`)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        // Fetch criteria for all domains
        const domainIds = (domainsData || []).map((d: { id: string }) => d.id);
        const { data: criteriaData } = await supabase
          .from('domain_assessment_criteria')
          .select('*')
          .in('domain_id', domainIds)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        // Combine domains with criteria
        type DomainRecord = { id: string; domain_id?: string; [key: string]: unknown };
        const domainsWithCriteria = (domainsData || []).map((domain: DomainRecord) => ({
          ...domain,
          criteria: (criteriaData || []).filter((c: DomainRecord) => c.domain_id === domain.id),
        })) as RiskDomainWithCriteria[];

        setDomains(domainsWithCriteria);

        // Fetch vendor assessments
        const { data: assessmentsData } = await supabase
          .from('vendor_domain_assessments')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        // Enrich assessments with domain data
        type AssessmentRecord = { domain_id: string; [key: string]: unknown };
        const enrichedAssessments = (assessmentsData || []).map((assessment: AssessmentRecord) => {
          const domain = domainsWithCriteria.find((d: RiskDomainWithCriteria) => d.id === assessment.domain_id);
          return {
            ...assessment,
            domain: domain!,
            scores: [],
          };
        }) as VendorDomainAssessmentWithDetails[];

        setAssessments(enrichedAssessments);
      } catch (error) {
        console.error('Error fetching assessment data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [vendorId, organizationId]);

  // Calculate overall progress
  const completedCount = assessments.filter((a) => a.status === 'completed').length;
  const overallProgress = domains.length > 0 ? (completedCount / domains.length) * 100 : 0;

  // Calculate overall score (weighted average)
  const overallScore = (() => {
    const completed = assessments.filter((a) => a.status === 'completed' && a.score !== null);
    if (completed.length === 0) return null;

    const totalWeight = completed.reduce((sum, a) => {
      const domain = domains.find((d) => d.id === a.domain_id);
      return sum + (domain?.weight || 1);
    }, 0);

    const weightedSum = completed.reduce((sum, a) => {
      const domain = domains.find((d) => d.id === a.domain_id);
      return sum + (a.score || 0) * (domain?.weight || 1);
    }, 0);

    return Math.round((weightedSum / totalWeight) * 10) / 10;
  })();

  // Handle opening assessment sheet
  const handleOpenAssessment = (domain: RiskDomainWithCriteria) => {
    const assessment = assessments.find((a) => a.domain_id === domain.id);
    setSelectedDomain(domain);
    setSelectedAssessment(assessment || null);
  };

  // Handle assessment completion
  const handleAssessmentComplete = () => {
    // Refresh data
    setSelectedDomain(null);
    setSelectedAssessment(null);
    // Trigger re-fetch
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary Card */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Multi-Domain Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Overall Score */}
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Overall Risk Score
              </p>
              <div className={cn(
                'text-4xl font-bold',
                overallScore !== null
                  ? overallScore >= 80 ? 'text-success'
                  : overallScore >= 60 ? 'text-warning'
                  : overallScore >= 40 ? 'text-orange-500'
                  : 'text-error'
                  : 'text-muted-foreground'
              )}>
                {overallScore !== null ? `${overallScore}` : '—'}
              </div>
              {overallScore !== null && (
                <p className="text-xs text-muted-foreground mt-1">out of 100</p>
              )}
            </div>

            {/* Domains Assessed */}
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Domains Assessed
              </p>
              <div className="text-4xl font-bold text-foreground">
                {completedCount}/{domains.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {domains.length - completedCount} remaining
              </p>
            </div>

            {/* Progress */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Assessment Progress
              </p>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {Math.round(overallProgress)}% complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => {
          const assessment = assessments.find((a) => a.domain_id === domain.id);
          const Icon = domainIcons[domain.name] || Shield;
          const status = assessment?.status || 'pending';
          const statusInfo = statusConfig[status];
          const StatusIcon = statusInfo.icon;

          return (
            <Card
              key={domain.id}
              className={cn(
                'card-elevated cursor-pointer transition-all hover:shadow-lg',
                assessment?.status === 'completed' && 'border-success/30'
              )}
              onClick={() => handleOpenAssessment(domain)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${domain.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: domain.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{domain.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Weight: {domain.weight}%
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn('h-4 w-4', statusInfo.color)} />
                  <span className={cn('text-sm font-medium', statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Score (if completed) */}
                {assessment?.status === 'completed' && assessment.score !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Score</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-bold',
                          assessment.risk_level && riskLevelColors[assessment.risk_level]
                        )}>
                          {assessment.score}
                        </span>
                        {assessment.risk_level && (
                          <Badge variant={riskLevelVariant[assessment.risk_level]}>
                            {assessment.risk_level.charAt(0).toUpperCase() + assessment.risk_level.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress
                      value={assessment.score}
                      className={cn(
                        'h-2',
                        assessment.risk_level === 'low' && '[&>div]:bg-success',
                        assessment.risk_level === 'medium' && '[&>div]:bg-warning',
                        assessment.risk_level === 'high' && '[&>div]:bg-orange-500',
                        assessment.risk_level === 'critical' && '[&>div]:bg-error'
                      )}
                    />
                  </div>
                )}

                {/* Criteria count */}
                <p className="text-xs text-muted-foreground">
                  {domain.criteria.length} assessment criteria
                </p>

                {/* Last assessed */}
                {assessment?.assessed_at && (
                  <p className="text-xs text-muted-foreground">
                    Last assessed:{' '}
                    {new Date(assessment.assessed_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}

                {/* Action button */}
                <Button
                  variant={assessment?.status === 'completed' ? 'outline' : 'default'}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAssessment(domain);
                  }}
                >
                  {assessment?.status === 'completed' ? 'View Assessment' : 'Start Assessment'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assessment Sheet */}
      <DomainAssessmentSheet
        open={!!selectedDomain}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDomain(null);
            setSelectedAssessment(null);
          }
        }}
        domain={selectedDomain}
        assessment={selectedAssessment}
        vendorId={vendorId}
        vendorName={vendorName}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}
