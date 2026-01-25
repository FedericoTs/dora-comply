'use client';

/**
 * Vendor ESG Tab Component
 *
 * Displays ESG (Environmental, Social, Governance) assessment,
 * certifications, and sustainability commitments for a vendor.
 */

import { useEffect, useState } from 'react';
import {
  Leaf,
  Users,
  Building2,
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  VendorESGProfile,
  VendorESGAssessmentWithDetails,
  VendorESGCertification,
  VendorESGCommitment,
  ESGRiskLevel,
  CERTIFICATION_LABELS,
  COMMITMENT_LABELS,
  COMMITMENT_STATUS_LABELS,
} from '@/lib/esg/types';
import { ESGAssessmentDialog } from './esg-assessment-dialog';
import { ESGCertificationDialog } from './esg-certification-dialog';
import { ESGCommitmentDialog } from './esg-commitment-dialog';

interface VendorESGTabProps {
  vendorId: string;
  vendorName: string;
  organizationId: string;
}

const RISK_COLORS: Record<ESGRiskLevel, string> = {
  low: 'text-emerald-600 bg-emerald-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50',
};

const RISK_LABELS: Record<ESGRiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

const PILLAR_ICONS = {
  environmental: Leaf,
  social: Users,
  governance: Building2,
};

const PILLAR_COLORS = {
  environmental: 'text-green-600 bg-green-50 border-green-200',
  social: 'text-blue-600 bg-blue-50 border-blue-200',
  governance: 'text-purple-600 bg-purple-50 border-purple-200',
};

export function VendorESGTab({ vendorId, vendorName, organizationId }: VendorESGTabProps) {
  const [profile, setProfile] = useState<VendorESGProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [commitmentDialogOpen, setCommitmentDialogOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors/${vendorId}/esg`);
      if (!response.ok) throw new Error('Failed to fetch ESG profile');
      const data = await response.json();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ESG data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <Button variant="outline" className="mt-4" onClick={fetchProfile}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const assessment = profile?.latest_assessment;
  const hasAssessment = !!assessment && assessment.status === 'completed';

  return (
    <div className="space-y-6">
      {/* ESG Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">ESG Assessment</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Environmental, Social & Governance sustainability profile
          </p>
        </div>
        <Button onClick={() => setAssessmentDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {hasAssessment ? 'New Assessment' : 'Start Assessment'}
        </Button>
      </div>

      {/* Score Overview Card */}
      {hasAssessment ? (
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Overall Score */}
              <div className="flex-shrink-0 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-4 border-primary">
                  <span className="text-3xl font-bold text-primary">
                    {assessment.overall_score ?? '—'}
                  </span>
                </div>
                <p className="text-sm font-medium mt-2">Overall Score</p>
                {assessment.esg_risk_level && (
                  <Badge className={cn('mt-1', RISK_COLORS[assessment.esg_risk_level])}>
                    {RISK_LABELS[assessment.esg_risk_level]}
                  </Badge>
                )}
              </div>

              {/* Pillar Scores */}
              <div className="flex-1 grid gap-4 sm:grid-cols-3">
                {(['environmental', 'social', 'governance'] as const).map((pillar) => {
                  const Icon = PILLAR_ICONS[pillar];
                  const score =
                    pillar === 'environmental'
                      ? assessment.environmental_score
                      : pillar === 'social'
                      ? assessment.social_score
                      : assessment.governance_score;

                  return (
                    <div
                      key={pillar}
                      className={cn(
                        'rounded-lg border p-4',
                        PILLAR_COLORS[pillar]
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{pillar}</span>
                      </div>
                      <div className="text-2xl font-bold">{score ?? '—'}</div>
                      <Progress
                        value={score ?? 0}
                        className="h-1.5 mt-2"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Assessment Info */}
              <div className="flex-shrink-0 text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Year:</span> {assessment.assessment_year}
                </p>
                <p>
                  <span className="font-medium">Assessed:</span>{' '}
                  {assessment.assessed_at
                    ? new Date(assessment.assessed_at).toLocaleDateString()
                    : 'Draft'}
                </p>
                {assessment.external_rating_provider && (
                  <p>
                    <span className="font-medium">External:</span>{' '}
                    {assessment.external_rating_provider} - {assessment.external_rating}
                  </p>
                )}
              </div>
            </div>

            {/* Key Insights */}
            {(assessment.key_strengths?.length > 0 || assessment.improvement_areas?.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2 mt-6 pt-6 border-t">
                {assessment.key_strengths?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Key Strengths
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {assessment.key_strengths.map((strength, i) => (
                        <li key={i}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.improvement_areas?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-amber-600" />
                      Improvement Areas
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {assessment.improvement_areas.map((area, i) => (
                        <li key={i}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="card-elevated border-dashed">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Leaf className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No ESG Assessment Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Start an ESG assessment to evaluate {vendorName}&apos;s environmental, social, and
              governance practices.
            </p>
            <Button onClick={() => setAssessmentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Certifications, Commitments, and History */}
      <Tabs defaultValue="certifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certifications" className="gap-2">
            <Award className="h-4 w-4" />
            Certifications ({profile?.certifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="commitments" className="gap-2">
            <Target className="h-4 w-4" />
            Commitments ({profile?.commitments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            History ({profile?.history?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              ESG-related certifications and standards compliance
            </p>
            <Button variant="outline" size="sm" onClick={() => setCertificationDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>

          {profile?.certifications && profile.certifications.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.certifications.map((cert) => (
                <CertificationCard key={cert.id} certification={cert} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No certifications recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Commitments Tab */}
        <TabsContent value="commitments" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Sustainability goals and ESG commitments
            </p>
            <Button variant="outline" size="sm" onClick={() => setCommitmentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Commitment
            </Button>
          </div>

          {profile?.commitments && profile.commitments.length > 0 ? (
            <div className="space-y-4">
              {profile.commitments.map((commitment) => (
                <CommitmentCard key={commitment.id} commitment={commitment} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No commitments recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Historical ESG assessment scores and trends
          </p>

          {profile?.history && profile.history.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-right font-medium">Overall</th>
                        <th className="p-3 text-right font-medium">Environmental</th>
                        <th className="p-3 text-right font-medium">Social</th>
                        <th className="p-3 text-right font-medium">Governance</th>
                        <th className="p-3 text-left font-medium">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.history.map((record, index) => {
                        const prevRecord = profile.history[index + 1];
                        const trend =
                          prevRecord && record.overall_score && prevRecord.overall_score
                            ? record.overall_score - prevRecord.overall_score
                            : null;

                        return (
                          <tr key={record.id} className="border-b last:border-0">
                            <td className="p-3">
                              {new Date(record.assessment_date).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-right font-medium">
                              <span className="inline-flex items-center gap-1">
                                {record.overall_score ?? '—'}
                                {trend !== null && (
                                  trend > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                                  ) : trend < 0 ? (
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                  ) : null
                                )}
                              </span>
                            </td>
                            <td className="p-3 text-right">{record.environmental_score ?? '—'}</td>
                            <td className="p-3 text-right">{record.social_score ?? '—'}</td>
                            <td className="p-3 text-right">{record.governance_score ?? '—'}</td>
                            <td className="p-3">
                              {record.esg_risk_level && (
                                <Badge
                                  variant="secondary"
                                  className={cn('text-xs', RISK_COLORS[record.esg_risk_level])}
                                >
                                  {RISK_LABELS[record.esg_risk_level]}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No historical data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ESGAssessmentDialog
        open={assessmentDialogOpen}
        onOpenChange={setAssessmentDialogOpen}
        vendorId={vendorId}
        vendorName={vendorName}
        onSuccess={fetchProfile}
      />
      <ESGCertificationDialog
        open={certificationDialogOpen}
        onOpenChange={setCertificationDialogOpen}
        vendorId={vendorId}
        onSuccess={fetchProfile}
      />
      <ESGCommitmentDialog
        open={commitmentDialogOpen}
        onOpenChange={setCommitmentDialogOpen}
        vendorId={vendorId}
        onSuccess={fetchProfile}
      />
    </div>
  );
}

// Sub-component for certification cards
function CertificationCard({ certification }: { certification: VendorESGCertification }) {
  const isActive = certification.status === 'active';
  const isExpired = certification.status === 'expired';
  const isPending = certification.status === 'pending';

  return (
    <Card className={cn('card-elevated', isExpired && 'opacity-60')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Award className={cn('h-5 w-5', isActive ? 'text-emerald-600' : 'text-muted-foreground')} />
            <CardTitle className="text-sm font-medium">
              {certification.certification_name}
            </CardTitle>
          </div>
          <Badge
            variant={isActive ? 'default' : isExpired ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {certification.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        {certification.issuing_body && (
          <p className="text-muted-foreground">
            Issued by: {certification.issuing_body}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {certification.issue_date && (
            <span>Issued: {new Date(certification.issue_date).toLocaleDateString()}</span>
          )}
          {certification.expiry_date && (
            <span className={cn(isExpired && 'text-destructive')}>
              Expires: {new Date(certification.expiry_date).toLocaleDateString()}
            </span>
          )}
        </div>
        {certification.certificate_url && (
          <a
            href={certification.certificate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View Certificate
          </a>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-component for commitment cards
function CommitmentCard({ commitment }: { commitment: VendorESGCommitment }) {
  const statusColors: Record<string, string> = {
    on_track: 'text-emerald-600 bg-emerald-50',
    at_risk: 'text-amber-600 bg-amber-50',
    behind: 'text-orange-600 bg-orange-50',
    achieved: 'text-blue-600 bg-blue-50',
    abandoned: 'text-gray-600 bg-gray-50',
  };

  const statusLabels: Record<string, string> = {
    on_track: 'On Track',
    at_risk: 'At Risk',
    behind: 'Behind Schedule',
    achieved: 'Achieved',
    abandoned: 'Abandoned',
  };

  return (
    <Card className="card-elevated">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{commitment.title}</h4>
              <Badge
                variant="secondary"
                className={cn('text-xs', statusColors[commitment.status])}
              >
                {statusLabels[commitment.status]}
              </Badge>
            </div>
            {commitment.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {commitment.description}
              </p>
            )}
            <div className="mt-3 space-y-2">
              {commitment.current_progress !== null && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{commitment.current_progress}%</span>
                  </div>
                  <Progress value={commitment.current_progress} className="h-1.5" />
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {commitment.target_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Target: {new Date(commitment.target_date).toLocaleDateString()}
                  </span>
                )}
                {commitment.target_value && (
                  <span>Target: {commitment.target_value}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
