/**
 * Finding Detail Content
 *
 * Client component for viewing and editing a finding
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Bug,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { updateFindingAction, deleteFindingAction } from '@/lib/testing/actions';
import {
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  getFindingSeverityLabel,
  getFindingStatusLabel,
} from '@/lib/testing/types';
import type { TestFinding, ResilienceTestWithRelations, FindingSeverity, FindingStatus } from '@/lib/testing/types';

interface FindingDetailContentProps {
  finding: TestFinding;
  test: ResilienceTestWithRelations;
}

export function FindingDetailContent({ finding, test }: FindingDetailContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: finding.title,
    severity: finding.severity,
    status: finding.status,
    description: finding.description,
    affected_systems: finding.affected_systems?.join(', ') || '',
    cvss_score: finding.cvss_score?.toString() || '',
    cve_ids: finding.cve_ids?.join(', ') || '',
    cwe_ids: finding.cwe_ids?.join(', ') || '',
    recommendation: finding.recommendation || '',
    remediation_plan: finding.remediation_plan || '',
    remediation_owner: finding.remediation_owner || '',
    remediation_deadline: finding.remediation_deadline || '',
    remediation_evidence: finding.remediation_evidence || '',
    verification_notes: finding.verification_notes || '',
    risk_acceptance_reason: finding.risk_acceptance_reason || '',
    risk_acceptance_expiry: finding.risk_acceptance_expiry || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const input = {
        title: formData.title,
        severity: formData.severity as FindingSeverity,
        status: formData.status as FindingStatus,
        description: formData.description,
        affected_systems: formData.affected_systems
          ? formData.affected_systems.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        cvss_score: formData.cvss_score ? parseFloat(formData.cvss_score) : undefined,
        cve_ids: formData.cve_ids
          ? formData.cve_ids.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        cwe_ids: formData.cwe_ids
          ? formData.cwe_ids.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        recommendation: formData.recommendation || undefined,
        remediation_plan: formData.remediation_plan || undefined,
        remediation_owner: formData.remediation_owner || undefined,
        remediation_deadline: formData.remediation_deadline || undefined,
        remediation_evidence: formData.remediation_evidence || undefined,
        verification_notes: formData.verification_notes || undefined,
        risk_acceptance_reason: formData.risk_acceptance_reason || undefined,
        risk_acceptance_expiry: formData.risk_acceptance_expiry || undefined,
      };

      const result = await updateFindingAction(finding.id, input);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Finding updated successfully');
      }
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteFindingAction(finding.id, finding.test_id);

      if (!result.success) {
        toast.error(result.error);
        setIsDeleting(false);
      } else {
        toast.success('Finding deleted');
        router.push(`/testing/tests/${finding.test_id}`);
      }
    });
  };

  // Check if finding is overdue
  const isOverdue =
    finding.status !== 'remediated' &&
    finding.status !== 'risk_accepted' &&
    finding.status !== 'verified' &&
    finding.remediation_deadline &&
    new Date(finding.remediation_deadline) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/testing/tests/${finding.test_id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/testing" className="hover:underline">
                Resilience Testing
              </Link>
              <span>/</span>
              <Link href={`/testing/tests/${finding.test_id}`} className="hover:underline">
                {test.name}
              </Link>
              <span>/</span>
              <span>Findings</span>
              <span>/</span>
              <span className="font-mono">{finding.finding_ref}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              {finding.title}
              <Badge
                variant={
                  finding.severity === 'critical'
                    ? 'destructive'
                    : finding.severity === 'high'
                    ? 'default'
                    : 'secondary'
                }
                className={
                  finding.severity === 'high'
                    ? 'bg-orange-500'
                    : finding.severity === 'medium'
                    ? 'bg-yellow-500 text-black'
                    : ''
                }
              >
                {getFindingSeverityLabel(finding.severity)}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {getFindingStatusLabel(finding.status)}
              {isOverdue && (
                <Badge variant="destructive" className="ml-2">
                  Overdue
                </Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Finding Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Finding Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) =>
                        setFormData({ ...formData, severity: value as FindingSeverity })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FINDING_SEVERITIES.map((sev) => (
                          <SelectItem key={sev} value={sev}>
                            {getFindingSeverityLabel(sev)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as FindingStatus })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FINDING_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {getFindingStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvss_score">CVSS Score</Label>
                    <Input
                      id="cvss_score"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.cvss_score}
                      onChange={(e) =>
                        setFormData({ ...formData, cvss_score: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="affected_systems">Affected Systems</Label>
                    <Input
                      id="affected_systems"
                      placeholder="Comma-separated list"
                      value={formData.affected_systems}
                      onChange={(e) =>
                        setFormData({ ...formData, affected_systems: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* References */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  References
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cve_ids">CVE IDs</Label>
                    <Input
                      id="cve_ids"
                      placeholder="e.g., CVE-2024-1234"
                      value={formData.cve_ids}
                      onChange={(e) => setFormData({ ...formData, cve_ids: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cwe_ids">CWE IDs</Label>
                    <Input
                      id="cwe_ids"
                      placeholder="e.g., CWE-89"
                      value={formData.cwe_ids}
                      onChange={(e) => setFormData({ ...formData, cwe_ids: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remediation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Remediation
                </CardTitle>
                <CardDescription>
                  Track the remediation progress for this finding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recommendation">Recommendation</Label>
                  <Textarea
                    id="recommendation"
                    rows={3}
                    placeholder="How to fix this issue..."
                    value={formData.recommendation}
                    onChange={(e) =>
                      setFormData({ ...formData, recommendation: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remediation_plan">Remediation Plan</Label>
                  <Textarea
                    id="remediation_plan"
                    rows={3}
                    placeholder="Detailed plan for fixing..."
                    value={formData.remediation_plan}
                    onChange={(e) =>
                      setFormData({ ...formData, remediation_plan: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="remediation_owner">Remediation Owner</Label>
                    <Input
                      id="remediation_owner"
                      placeholder="Person responsible"
                      value={formData.remediation_owner}
                      onChange={(e) =>
                        setFormData({ ...formData, remediation_owner: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remediation_deadline">Deadline</Label>
                    <Input
                      id="remediation_deadline"
                      type="date"
                      value={formData.remediation_deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, remediation_deadline: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remediation_evidence">Remediation Evidence</Label>
                  <Textarea
                    id="remediation_evidence"
                    rows={2}
                    placeholder="Evidence that the fix was applied..."
                    value={formData.remediation_evidence}
                    onChange={(e) =>
                      setFormData({ ...formData, remediation_evidence: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification_notes">Verification Notes</Label>
                  <Textarea
                    id="verification_notes"
                    rows={2}
                    placeholder="Notes from verification testing..."
                    value={formData.verification_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, verification_notes: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Risk Acceptance (only show if relevant) */}
            {(formData.status === 'risk_accepted' || formData.risk_acceptance_reason) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Risk Acceptance
                  </CardTitle>
                  <CardDescription>
                    Document the risk acceptance decision
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="risk_acceptance_reason">Acceptance Reason</Label>
                    <Textarea
                      id="risk_acceptance_reason"
                      rows={3}
                      placeholder="Justify why this risk is being accepted..."
                      value={formData.risk_acceptance_reason}
                      onChange={(e) =>
                        setFormData({ ...formData, risk_acceptance_reason: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="risk_acceptance_expiry">Acceptance Expiry</Label>
                    <Input
                      id="risk_acceptance_expiry"
                      type="date"
                      value={formData.risk_acceptance_expiry}
                      onChange={(e) =>
                        setFormData({ ...formData, risk_acceptance_expiry: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      When this risk acceptance should be reviewed
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={isPending || isDeleting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/testing/tests/${finding.test_id}`}>Back to Test</Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      disabled={isPending || isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Finding
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Finding</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this finding? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono">{finding.finding_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(finding.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(finding.updated_at).toLocaleDateString()}</span>
                </div>
                {finding.remediation_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remediated</span>
                    <span>{new Date(finding.remediation_date).toLocaleDateString()}</span>
                  </div>
                )}
                {finding.verified_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    <span>{new Date(finding.verified_date).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Quick Status Change
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {formData.status === 'open' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setFormData({ ...formData, status: 'in_remediation' })}
                  >
                    Start Remediation
                  </Button>
                )}
                {formData.status === 'in_remediation' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setFormData({ ...formData, status: 'remediated' })}
                  >
                    Mark Remediated
                  </Button>
                )}
                {formData.status === 'remediated' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setFormData({ ...formData, status: 'verified' })}
                  >
                    Mark Verified
                  </Button>
                )}
                {(formData.status === 'open' || formData.status === 'in_remediation') && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setFormData({ ...formData, status: 'risk_accepted' })}
                    >
                      Accept Risk
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setFormData({ ...formData, status: 'false_positive' })}
                    >
                      Mark False Positive
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Overdue Warning */}
            {isOverdue && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This finding was due on{' '}
                    {new Date(finding.remediation_deadline!).toLocaleDateString()}. Please update
                    the status or extend the deadline.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
