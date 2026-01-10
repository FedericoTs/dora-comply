'use client';

/**
 * DORA Gap Remediation Component
 *
 * Shows all 45 DORA requirements with their coverage status and allows
 * users to upload evidence or attest to requirements not covered by SOC 2.
 *
 * Features:
 * - Full list of DORA requirements grouped by pillar
 * - Coverage status (SOC 2 covered, manually evidenced, gap)
 * - Evidence upload and attestation forms
 * - Progress tracking toward 100% compliance
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  FileText,
  Link as LinkIcon,
  Shield,
  AlertCircle,
  TestTube2,
  Building2,
  Share2,
  ChevronDown,
  ChevronRight,
  Plus,
  ExternalLink,
  Clock,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { DORA_REQUIREMENTS } from '@/lib/compliance/dora-requirements-data';
import type { DORAPillar, DORARequirement } from '@/lib/compliance/dora-types';
import { DORAPillarLabels } from '@/lib/compliance/dora-types';

// Types
interface DORAEvidence {
  id: string;
  requirement_id: string;
  evidence_type: 'document' | 'attestation' | 'link' | 'soc2_control';
  title: string;
  description?: string;
  external_link?: string;
  attested_by?: string;
  attested_at?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  valid_until?: string;
  created_at: string;
}

interface RequirementWithEvidence extends DORARequirement {
  soc2Coverage: 'full' | 'partial' | 'none';
  manualEvidence: DORAEvidence[];
  overallStatus: 'covered' | 'partial' | 'gap';
}

interface DORAGapRemediationProps {
  vendorId: string;
  vendorName: string;
  soc2CoverageByRequirement: Record<string, 'full' | 'partial' | 'none'>;
  className?: string;
}

// Pillar icons
const PillarIcons: Record<DORAPillar, React.ReactNode> = {
  ICT_RISK: <Shield className="h-4 w-4" />,
  INCIDENT: <AlertCircle className="h-4 w-4" />,
  TESTING: <TestTube2 className="h-4 w-4" />,
  TPRM: <Building2 className="h-4 w-4" />,
  SHARING: <Share2 className="h-4 w-4" />,
};

export function DORAGapRemediation({
  vendorId,
  vendorName,
  soc2CoverageByRequirement,
  className,
}: DORAGapRemediationProps) {
  const [evidence, setEvidence] = useState<DORAEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPillars, setExpandedPillars] = useState<Set<DORAPillar>>(new Set());
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementWithEvidence | null>(null);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);

  // Fetch existing evidence
  useEffect(() => {
    async function fetchEvidence() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('dora_evidence')
        .select('*')
        .eq('vendor_id', vendorId)
        .neq('status', 'rejected');

      if (error) {
        console.error('Error fetching evidence:', error);
      } else {
        setEvidence(data || []);
      }
      setLoading(false);
    }

    fetchEvidence();
  }, [vendorId]);

  // Group requirements by pillar and add evidence
  const requirementsByPillar = DORA_REQUIREMENTS.reduce<Record<DORAPillar, RequirementWithEvidence[]>>(
    (acc, req) => {
      const soc2Coverage = soc2CoverageByRequirement[req.id] || 'none';
      const manualEvidence = evidence.filter((e) => e.requirement_id === req.id);
      const hasVerifiedEvidence = manualEvidence.some((e) => e.status === 'verified');
      const hasPendingEvidence = manualEvidence.some((e) => e.status === 'pending');

      let overallStatus: 'covered' | 'partial' | 'gap' = 'gap';
      if (soc2Coverage === 'full' || hasVerifiedEvidence) {
        overallStatus = 'covered';
      } else if (soc2Coverage === 'partial' || hasPendingEvidence) {
        overallStatus = 'partial';
      }

      const reqWithEvidence: RequirementWithEvidence = {
        ...req,
        soc2Coverage,
        manualEvidence,
        overallStatus,
      };

      if (!acc[req.pillar]) acc[req.pillar] = [];
      acc[req.pillar].push(reqWithEvidence);
      return acc;
    },
    {} as Record<DORAPillar, RequirementWithEvidence[]>
  );

  // Calculate stats
  const totalRequirements = DORA_REQUIREMENTS.length;
  const coveredCount = Object.values(requirementsByPillar)
    .flat()
    .filter((r) => r.overallStatus === 'covered').length;
  const partialCount = Object.values(requirementsByPillar)
    .flat()
    .filter((r) => r.overallStatus === 'partial').length;
  const gapCount = totalRequirements - coveredCount - partialCount;
  const coveragePercentage = Math.round((coveredCount / totalRequirements) * 100);

  const togglePillar = (pillar: DORAPillar) => {
    setExpandedPillars((prev) => {
      const next = new Set(prev);
      if (next.has(pillar)) {
        next.delete(pillar);
      } else {
        next.add(pillar);
      }
      return next;
    });
  };

  const getStatusIcon = (status: 'covered' | 'partial' | 'gap') => {
    switch (status) {
      case 'covered':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'gap':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: 'covered' | 'partial' | 'gap') => {
    switch (status) {
      case 'covered':
        return <Badge className="bg-success text-white">Covered</Badge>;
      case 'partial':
        return <Badge className="bg-warning text-white">Partial</Badge>;
      case 'gap':
        return <Badge variant="destructive">Gap</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('space-y-6', className)}>
        {/* Progress Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">DORA Compliance Progress</CardTitle>
                <CardDescription>
                  Track and close gaps across all 45 DORA requirements
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{coveragePercentage}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={coveragePercentage} className="h-3 mb-4" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-success/10">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-2xl font-bold text-success">{coveredCount}</span>
                </div>
                <div className="text-xs text-muted-foreground">Covered</div>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-2xl font-bold text-warning">{partialCount}</span>
                </div>
                <div className="text-xs text-muted-foreground">Partial</div>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">{gapCount}</span>
                </div>
                <div className="text-xs text-muted-foreground">Gaps</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements by Pillar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Requirements by Pillar</CardTitle>
            <CardDescription>
              Click to expand and add evidence for gaps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(requirementsByPillar) as [DORAPillar, RequirementWithEvidence[]][]).map(
              ([pillar, requirements]) => {
                const pillarCovered = requirements.filter((r) => r.overallStatus === 'covered').length;
                const pillarTotal = requirements.length;
                const pillarPercentage = Math.round((pillarCovered / pillarTotal) * 100);
                const isExpanded = expandedPillars.has(pillar);

                return (
                  <Collapsible key={pillar} open={isExpanded} onOpenChange={() => togglePillar(pillar)}>
                    <CollapsibleTrigger asChild>
                      <div
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                          isExpanded && 'rounded-b-none'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-lg',
                            pillarPercentage === 100
                              ? 'bg-success/20 text-success'
                              : pillarPercentage >= 50
                              ? 'bg-warning/20 text-warning'
                              : 'bg-destructive/20 text-destructive'
                          )}
                        >
                          {PillarIcons[pillar]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{DORAPillarLabels[pillar]}</div>
                          <div className="text-sm text-muted-foreground">
                            {pillarCovered} of {pillarTotal} requirements covered
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold">{pillarPercentage}%</div>
                            <Progress value={pillarPercentage} className="h-1.5 w-20" />
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-x border-b rounded-b-lg divide-y">
                        {requirements.map((req) => (
                          <div
                            key={req.id}
                            className={cn(
                              'p-4 hover:bg-muted/30 transition-colors',
                              req.overallStatus === 'gap' && 'bg-destructive/5'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {getStatusIcon(req.overallStatus)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {req.article_number}
                                  </Badge>
                                  <span className="font-medium">{req.article_title}</span>
                                  {getStatusBadge(req.overallStatus)}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {req.requirement_text}
                                </p>

                                {/* Evidence indicators */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {req.soc2Coverage !== 'none' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="text-xs gap-1">
                                          <FileText className="h-3 w-3" />
                                          SOC 2 {req.soc2Coverage === 'full' ? 'Full' : 'Partial'}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Evidence from parsed SOC 2 report
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {req.manualEvidence.map((ev) => (
                                    <Tooltip key={ev.id}>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant={ev.status === 'verified' ? 'default' : 'outline'}
                                          className={cn('text-xs gap-1', {
                                            'bg-success': ev.status === 'verified',
                                            'border-warning text-warning': ev.status === 'pending',
                                          })}
                                        >
                                          {ev.evidence_type === 'document' && <FileText className="h-3 w-3" />}
                                          {ev.evidence_type === 'link' && <LinkIcon className="h-3 w-3" />}
                                          {ev.evidence_type === 'attestation' && <User className="h-3 w-3" />}
                                          {ev.title}
                                          {ev.status === 'pending' && <Clock className="h-3 w-3" />}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{ev.description || ev.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Status: {ev.status}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>

                                {/* Evidence needed hint */}
                                {req.overallStatus !== 'covered' && req.evidence_needed && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    <span className="font-medium">Evidence needed: </span>
                                    {req.evidence_needed.slice(0, 3).join(', ')}
                                    {req.evidence_needed.length > 3 && '...'}
                                  </div>
                                )}
                              </div>

                              {/* Add Evidence Button */}
                              {req.overallStatus !== 'covered' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant={req.overallStatus === 'gap' ? 'default' : 'outline'}
                                      className="shrink-0"
                                      onClick={() => setSelectedRequirement(req)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Evidence
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <AddEvidenceForm
                                      requirement={req}
                                      vendorId={vendorId}
                                      onSuccess={(newEvidence) => {
                                        setEvidence((prev) => [...prev, newEvidence]);
                                      }}
                                    />
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

// Add Evidence Form Component
function AddEvidenceForm({
  requirement,
  vendorId,
  onSuccess,
}: {
  requirement: RequirementWithEvidence;
  vendorId: string;
  onSuccess: (evidence: DORAEvidence) => void;
}) {
  const [evidenceType, setEvidenceType] = useState<'attestation' | 'link' | 'document'>('attestation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) throw new Error('No organization found');

      const evidenceData = {
        organization_id: userData.organization_id,
        vendor_id: vendorId,
        requirement_id: requirement.id,
        evidence_type: evidenceType,
        title,
        description,
        external_link: evidenceType === 'link' ? externalLink : null,
        attested_by: evidenceType === 'attestation' ? user.id : null,
        attested_at: evidenceType === 'attestation' ? new Date().toISOString() : null,
        attestation_statement: evidenceType === 'attestation' ? description : null,
        status: 'pending',
        created_by: user.id,
      };

      const { data, error: insertError } = await supabase
        .from('dora_evidence')
        .insert(evidenceData)
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess(data);

      // Reset form
      setTitle('');
      setDescription('');
      setExternalLink('');
    } catch (err) {
      console.error('Error adding evidence:', err);
      setError(err instanceof Error ? err.message : 'Failed to add evidence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Evidence for {requirement.article_number}</DialogTitle>
        <DialogDescription>{requirement.article_title}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Evidence needed hint */}
        {requirement.evidence_needed && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-1">Suggested evidence:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              {requirement.evidence_needed.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence Type */}
        <div className="space-y-2">
          <Label>Evidence Type</Label>
          <Select value={evidenceType} onValueChange={(v) => setEvidenceType(v as typeof evidenceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attestation">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Self-Attestation
                </div>
              </SelectItem>
              <SelectItem value="link">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  External Link
                </div>
              </SelectItem>
              <SelectItem value="document">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Reference
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder={
              evidenceType === 'attestation'
                ? 'e.g., Internal Policy Compliance'
                : evidenceType === 'link'
                ? 'e.g., Incident Response Procedure'
                : 'e.g., ICT Risk Framework v2.1'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* External Link (for link type) */}
        {evidenceType === 'link' && (
          <div className="space-y-2">
            <Label htmlFor="link">URL</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://..."
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              required
            />
          </div>
        )}

        {/* Description / Statement */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {evidenceType === 'attestation' ? 'Attestation Statement' : 'Description'}
          </Label>
          <Textarea
            id="description"
            placeholder={
              evidenceType === 'attestation'
                ? 'Describe how your organization meets this requirement...'
                : 'Describe the evidence and how it addresses this requirement...'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add Evidence'}
        </Button>
      </DialogFooter>
    </form>
  );
}
