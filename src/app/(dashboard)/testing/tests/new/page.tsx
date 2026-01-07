/**
 * New Test Page
 *
 * Create a new resilience test per DORA Article 25
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, FlaskConical, Info } from 'lucide-react';
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
import { createTestAction } from '@/lib/testing/actions';
import {
  TEST_TYPES,
  TESTER_TYPES,
  getTestTypeLabel,
  getTesterTypeLabel,
} from '@/lib/testing/types';
import { RECOGNIZED_CERTIFICATIONS } from '@/lib/testing/validation';

export default function NewTestPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: '',
    test_type: '' as string,
    description: '',
    methodology: '',
    scope_description: '',
    planned_start_date: '',
    planned_end_date: '',
    tester_type: '' as string,
    tester_name: '',
    tester_organization: '',
    tester_certifications: [] as string[],
    estimated_cost: '',
  });

  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.test_type) {
      toast.error('Please fill in required fields');
      return;
    }

    startTransition(async () => {
      const input = {
        name: formData.name,
        test_type: formData.test_type as typeof TEST_TYPES[number],
        description: formData.description || undefined,
        methodology: formData.methodology || undefined,
        scope_description: formData.scope_description || undefined,
        planned_start_date: formData.planned_start_date || undefined,
        planned_end_date: formData.planned_end_date || undefined,
        tester_type: formData.tester_type
          ? (formData.tester_type as typeof TESTER_TYPES[number])
          : undefined,
        tester_name: formData.tester_name || undefined,
        tester_organization: formData.tester_organization || undefined,
        tester_certifications: selectedCerts.length > 0 ? selectedCerts : undefined,
        estimated_cost: formData.estimated_cost
          ? parseFloat(formData.estimated_cost)
          : undefined,
      };

      const result = await createTestAction(input);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('Test created successfully');
        router.push(`/testing/tests/${result.test.id}`);
      }
    });
  };

  const toggleCertification = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/testing/tests">
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
            <span>New</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">New Resilience Test</h1>
          <p className="text-muted-foreground">Create a test per DORA Article 25</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Test Information
                </CardTitle>
                <CardDescription>
                  Define the test name, type, and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Test Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Q1 2025 Vulnerability Assessment"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test_type">
                      Test Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.test_type}
                      onValueChange={(value) => setFormData({ ...formData, test_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEST_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getTestTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose and objectives of this test..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope_description">Scope</Label>
                  <Textarea
                    id="scope_description"
                    placeholder="Define the systems, applications, and boundaries in scope..."
                    rows={3}
                    value={formData.scope_description}
                    onChange={(e) =>
                      setFormData({ ...formData, scope_description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="methodology">Methodology</Label>
                  <Textarea
                    id="methodology"
                    placeholder="Describe the testing methodology (e.g., OWASP, PTES, NIST)..."
                    rows={3}
                    value={formData.methodology}
                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule</CardTitle>
                <CardDescription>Plan the test timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="planned_start_date">Planned Start Date</Label>
                    <Input
                      id="planned_start_date"
                      type="date"
                      value={formData.planned_start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, planned_start_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planned_end_date">Planned End Date</Label>
                    <Input
                      id="planned_end_date"
                      type="date"
                      value={formData.planned_end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, planned_end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tester Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tester Information</CardTitle>
                <CardDescription>
                  Article 27 requires testers to have appropriate certifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tester_type">Tester Type</Label>
                    <Select
                      value={formData.tester_type}
                      onValueChange={(value) => setFormData({ ...formData, tester_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TESTER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getTesterTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tester_name">Tester Name</Label>
                    <Input
                      id="tester_name"
                      placeholder="e.g., John Smith"
                      value={formData.tester_name}
                      onChange={(e) =>
                        setFormData({ ...formData, tester_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tester_organization">Organization</Label>
                    <Input
                      id="tester_organization"
                      placeholder="e.g., Security Firm Ltd."
                      value={formData.tester_organization}
                      onChange={(e) =>
                        setFormData({ ...formData, tester_organization: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Certifications (Article 27)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select applicable certifications held by the tester
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {RECOGNIZED_CERTIFICATIONS.slice(0, 16).map((cert) => (
                      <Button
                        key={cert}
                        type="button"
                        variant={selectedCerts.includes(cert) ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => toggleCertification(cert)}
                      >
                        {cert}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="estimated_cost">Estimated Cost (EUR)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 15000"
                    value={formData.estimated_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_cost: e.target.value })
                    }
                  />
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
                  {isPending ? 'Creating...' : 'Create Test'}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/testing/tests">Cancel</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Article 25 Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Article 25 Test Types
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>DORA Article 25 requires 10 types of tests:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Vulnerability assessments</li>
                  <li>Penetration testing</li>
                  <li>Scenario-based testing</li>
                  <li>Compatibility testing</li>
                  <li>Performance testing</li>
                  <li>End-to-end testing</li>
                  <li>Source code reviews</li>
                  <li>Network security assessments</li>
                  <li>Gap analyses</li>
                  <li>Physical security reviews</li>
                </ol>
              </CardContent>
            </Card>

            {/* Tester Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Article 27 Requirements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Testers must possess:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Highest suitability and expertise</li>
                  <li>Relevant professional accreditations</li>
                  <li>Independence from organization</li>
                  <li>Professional indemnity insurance</li>
                </ul>
                <p className="pt-2 text-xs">
                  For TLPT, testers must follow TIBER-EU or equivalent framework
                  with recognized certifications (CREST, OSCP, etc.).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
