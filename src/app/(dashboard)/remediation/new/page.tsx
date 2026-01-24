/**
 * New Remediation Plan Page
 *
 * Multi-step wizard for creating comprehensive remediation plans.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getVendors } from '@/lib/vendors/queries';
import { getOrganizationMembers } from '@/lib/remediation/queries';
import { PlanWizard } from '@/components/remediation/plan-wizard';
import type { SourceType } from '@/lib/remediation/types';

export const metadata = {
  title: 'New Remediation Plan | Compliance',
  description: 'Create a new remediation plan',
};

interface PageProps {
  searchParams: Promise<{
    sourceType?: string;
    sourceId?: string;
    vendorId?: string;
    title?: string;
    description?: string;
  }>;
}

async function WizardContent({ searchParams }: PageProps) {
  const params = await searchParams;

  // Fetch vendors and team members in parallel
  const [vendorsResult, teamMembers] = await Promise.all([
    getVendors({
      pagination: { page: 1, limit: 500 },
    }),
    getOrganizationMembers(),
  ]);

  const vendors = vendorsResult.data.map((v) => ({
    id: v.id,
    name: v.name,
  }));

  const members = teamMembers.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    email: m.email,
  }));

  return (
    <PlanWizard
      vendors={vendors}
      teamMembers={members}
      sourceType={params.sourceType as SourceType | undefined}
      sourceId={params.sourceId}
      vendorId={params.vendorId}
      prefilledTitle={params.title}
      prefilledDescription={params.description}
    />
  );
}

function WizardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20" />
      <Skeleton className="h-16" />
      <Skeleton className="h-[400px]" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default function NewRemediationPlanPage({ searchParams }: PageProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/remediation">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Remediation Plan</h1>
          <p className="text-muted-foreground text-sm">
            Create a plan to track and resolve compliance gaps
          </p>
        </div>
      </div>

      <Suspense fallback={<WizardLoading />}>
        <WizardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
