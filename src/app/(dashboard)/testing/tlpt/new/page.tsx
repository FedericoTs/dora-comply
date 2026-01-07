/**
 * New TLPT Page
 *
 * Plan a new TLPT engagement per DORA Article 26
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Target, Info, CheckCircle2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createTLPTAction } from '@/lib/testing/actions';
import { TLPT_FRAMEWORKS, getTLPTFrameworkLabel } from '@/lib/testing/types';

export default function NewTLPTPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: '',
    framework: 'tiber_eu',
    next_tlpt_due: '',
    estimated_cost: '',
    scope_systems: '',
    scope_critical_functions: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Please enter a name for the TLPT engagement');
      return;
    }

    startTransition(async () => {
      const input = {
        name: formData.name,
        framework: formData.framework as typeof TLPT_FRAMEWORKS[number],
        next_tlpt_due: formData.next_tlpt_due || undefined,
        estimated_cost: formData.estimated_cost
          ? parseFloat(formData.estimated_cost)
          : undefined,
        scope_systems: formData.scope_systems
          ? formData.scope_systems.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        scope_critical_functions: formData.scope_critical_functions
          ? formData.scope_critical_functions.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      };

      const result = await createTLPTAction(input);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success('TLPT engagement created successfully');
        router.push(`/testing/tlpt/${result.tlpt.id}`);
      }
    });
  };

  // Calculate default due date (3 years from now)
  const defaultDueDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/testing/tlpt">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/testing" className="hover:underline">
              Resilience Testing
            </Link>
            <span>/</span>
            <Link href="/testing/tlpt" className="hover:underline">
              TLPT
            </Link>
            <span>/</span>
            <span>New</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Plan TLPT Engagement</h1>
          <p className="text-muted-foreground">
            Threat-Led Penetration Testing per DORA Article 26
          </p>
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
                  <Target className="h-4 w-4" />
                  TLPT Information
                </CardTitle>
                <CardDescription>
                  Define the TLPT engagement details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Engagement Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., 2025 TIBER-EU TLPT"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="framework">Framework</Label>
                    <Select
                      value={formData.framework}
                      onValueChange={(value) => setFormData({ ...formData, framework: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {TLPT_FRAMEWORKS.map((fw) => (
                          <SelectItem key={fw} value={fw}>
                            {getTLPTFrameworkLabel(fw)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="next_tlpt_due">Next TLPT Due Date</Label>
                    <Input
                      id="next_tlpt_due"
                      type="date"
                      value={formData.next_tlpt_due}
                      onChange={(e) =>
                        setFormData({ ...formData, next_tlpt_due: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Article 26 requires TLPT at least every 3 years
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_cost">Estimated Cost (EUR)</Label>
                    <Input
                      id="estimated_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 150000"
                      value={formData.estimated_cost}
                      onChange={(e) =>
                        setFormData({ ...formData, estimated_cost: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scope Definition</CardTitle>
                <CardDescription>
                  Define the systems and critical functions in scope
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scope_systems">Systems in Scope</Label>
                  <Textarea
                    id="scope_systems"
                    placeholder="Enter systems separated by commas, e.g., Core Banking, Payment Gateway, Trading Platform"
                    rows={3}
                    value={formData.scope_systems}
                    onChange={(e) =>
                      setFormData({ ...formData, scope_systems: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    TLPT must cover live production systems supporting critical functions
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope_critical_functions">Critical Functions</Label>
                  <Textarea
                    id="scope_critical_functions"
                    placeholder="Enter critical functions separated by commas, e.g., Payments Processing, Customer Authentication, Trading Operations"
                    rows={3}
                    value={formData.scope_critical_functions}
                    onChange={(e) =>
                      setFormData({ ...formData, scope_critical_functions: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Identify critical or important functions per Article 26(8)
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
                  {isPending ? 'Creating...' : 'Create TLPT'}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/testing/tlpt">Cancel</Link>
                </Button>
              </CardContent>
            </Card>

            {/* TIBER-EU Phases */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  TIBER-EU Phases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { phase: 1, name: 'Planning', desc: 'Scope definition and preparation' },
                  { phase: 2, name: 'Threat Intelligence', desc: 'TI provider analysis' },
                  { phase: 3, name: 'Red Team Test', desc: 'Active testing phase' },
                  { phase: 4, name: 'Closure', desc: 'Purple team and remediation' },
                ].map((item) => (
                  <div key={item.phase} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {item.phase}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Article 26 Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Article 26 Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>TLPT every 3 years for significant entities</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Use recognized frameworks (TIBER-EU)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Independent TI and RT providers</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Cover critical functions and live systems</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Report to competent authorities</span>
                </div>
              </CardContent>
            </Card>

            {/* Provider Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provider Requirements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Threat Intelligence:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>External, independent provider</li>
                  <li>Expertise in threat analysis</li>
                  <li>Knowledge of financial sector</li>
                </ul>
                <p className="font-medium text-foreground pt-2">Red Team:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>CREST, CBEST, or equivalent accredited</li>
                  <li>Professional indemnity insurance</li>
                  <li>Independence from organization</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
