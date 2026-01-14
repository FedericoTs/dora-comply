/**
 * Testing Dashboard Page
 *
 * Resilience testing management for DORA Chapter IV compliance
 * Articles 24-27 - Digital Operational Resilience Testing
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Target, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getOrganizationContext } from '@/lib/org/context';
import {
  TestingStatsCards,
  StatsCardsSkeleton,
  TestTypeCoverageCard,
  OpenFindingsCard,
  RecentTestsCard,
  TLPTStatusCard,
  NonSignificantTLPTInfo,
  DORARequirementsCard,
  ListSkeleton,
} from './components';

export const metadata = {
  title: 'Resilience Testing | DORA Comply',
  description: 'Digital operational resilience testing management',
};

export default async function TestingPage() {
  // Fetch organization context for entity classification
  const orgContext = await getOrganizationContext();
  const tlptRequired = orgContext?.classification?.tlptRequired ?? false;
  const simplifiedFramework = orgContext?.classification?.simplifiedFramework ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resilience Testing</h1>
          <p className="text-muted-foreground">
            Digital operational resilience testing per DORA Chapter IV
          </p>
        </div>
        <div className="flex gap-2">
          {tlptRequired && (
            <Button variant="outline" asChild>
              <Link href="/testing/tlpt/new">
                <Target className="mr-2 h-4 w-4" />
                Plan TLPT
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/testing/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Simplified Framework Banner */}
      {simplifiedFramework && (
        <Alert className="border-success/50 bg-success/10">
          <Scale className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Simplified Framework (Article 16)</AlertTitle>
          <AlertDescription>
            Your organization qualifies for proportionate testing requirements. Focus on basic
            resilience testing per your risk profile.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <TestingStatsCards tlptRequired={tlptRequired} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Main Column */}
        <div className="space-y-6">
          <Suspense fallback={<ListSkeleton />}>
            <RecentTestsCard />
          </Suspense>

          {/* TLPT Section - only for significant entities, or show info for non-significant */}
          {tlptRequired ? (
            <Suspense fallback={<ListSkeleton />}>
              <TLPTStatusCard />
            </Suspense>
          ) : (
            <NonSignificantTLPTInfo />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <TestTypeCoverageCard />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-48" />}>
            <OpenFindingsCard />
          </Suspense>

          {/* Quick Reference Card */}
          <DORARequirementsCard tlptRequired={tlptRequired} />
        </div>
      </div>
    </div>
  );
}
