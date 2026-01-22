/**
 * New Finding Page
 *
 * Create a new finding for a resilience test
 */

'use client';

import { useState, useTransition, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Bug, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createFindingAction } from '@/lib/testing/actions';
import {
  FINDING_SEVERITIES,
  getFindingSeverityLabel,
} from '@/lib/testing/types';
import type { FindingSeverity } from '@/lib/testing/types';

interface NewFindingPageProps {
  params: Promise<{ id: string }>;
}

export default function NewFindingPage({ params }: NewFindingPageProps) {
  const resolvedParams = use(params);
  const testId = resolvedParams.id;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: '',
    severity: 'medium' as FindingSeverity,
    description: '',
    affected_systems: '',
    cvss_score: '',
    cve_ids: '',
    cwe_ids: '',
    recommendation: '',
    remediation_deadline: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Please enter a title for the finding');
      return;
    }

    if (!formData.description) {
      toast.error('Please enter a description for the finding');
      return;
    }

    startTransition(async () => {
      const input = {
        test_id: testId,
        title: formData.title,
        severity: formData.severity,
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
        remediation_deadline: formData.remediation_deadline || undefined,
      };

      const result = await createFindingAction(input);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Finding created successfully');
        router.push(`/testing/tests/${testId}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/testing/tests/${testId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/testing" className="hover:underline">
              Resilience Testing
            </Link>
            <span>/</span>
            <Link href="/testing/tests" className="hover:underline">
              Tests
            </Link>
            <span>/</span>
            <Link href={`/testing/tests/${testId}`} className="hover:underline">
              Test
            </Link>
            <span>/</span>
            <span>New Finding</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Finding</h1>
          <p className="text-muted-foreground">
            Record an issue discovered during testing
          </p>
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
                <CardDescription>
                  Describe the issue found during testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., SQL Injection in User Login"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
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
                        <SelectValue placeholder="Select severity" />
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
                    <Label htmlFor="cvss_score">CVSS Score</Label>
                    <Input
                      id="cvss_score"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="e.g., 7.5"
                      value={formData.cvss_score}
                      onChange={(e) =>
                        setFormData({ ...formData, cvss_score: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the finding, including how it was discovered, potential impact, and technical details..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affected_systems">Affected Systems</Label>
                  <Input
                    id="affected_systems"
                    placeholder="Enter systems separated by commas, e.g., User Portal, API Gateway"
                    value={formData.affected_systems}
                    onChange={(e) =>
                      setFormData({ ...formData, affected_systems: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* References */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">References</CardTitle>
                <CardDescription>
                  Link to CVE/CWE identifiers if applicable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cve_ids">CVE IDs</Label>
                    <Input
                      id="cve_ids"
                      placeholder="e.g., CVE-2024-1234, CVE-2024-5678"
                      value={formData.cve_ids}
                      onChange={(e) => setFormData({ ...formData, cve_ids: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Common Vulnerabilities and Exposures identifiers
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cwe_ids">CWE IDs</Label>
                    <Input
                      id="cwe_ids"
                      placeholder="e.g., CWE-89, CWE-79"
                      value={formData.cwe_ids}
                      onChange={(e) => setFormData({ ...formData, cwe_ids: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Common Weakness Enumeration identifiers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remediation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Remediation</CardTitle>
                <CardDescription>
                  Recommendations for fixing this issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recommendation">Recommendation</Label>
                  <Textarea
                    id="recommendation"
                    placeholder="Describe how to fix this issue..."
                    rows={4}
                    value={formData.recommendation}
                    onChange={(e) =>
                      setFormData({ ...formData, recommendation: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remediation_deadline">Remediation Deadline</Label>
                  <Input
                    id="remediation_deadline"
                    type="date"
                    value={formData.remediation_deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, remediation_deadline: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Target date for fixing this issue
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {isPending ? 'Creating...' : 'Create Finding'}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/testing/tests/${testId}`}>Cancel</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Severity Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Severity Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-destructive shrink-0" />
                  <div>
                    <p className="font-medium">Critical (CVSS 9.0-10.0)</p>
                    <p className="text-muted-foreground text-xs">
                      Exploitable remotely, complete system compromise
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0" />
                  <div>
                    <p className="font-medium">High (CVSS 7.0-8.9)</p>
                    <p className="text-muted-foreground text-xs">
                      Significant impact, some exploitation complexity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 shrink-0" />
                  <div>
                    <p className="font-medium">Medium (CVSS 4.0-6.9)</p>
                    <p className="text-muted-foreground text-xs">
                      Moderate impact, requires user interaction
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="font-medium">Low (CVSS 0.1-3.9)</p>
                    <p className="text-muted-foreground text-xs">
                      Limited impact, difficult to exploit
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-gray-400 shrink-0" />
                  <div>
                    <p className="font-medium">Informational</p>
                    <p className="text-muted-foreground text-xs">
                      Best practice recommendation, no direct risk
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
