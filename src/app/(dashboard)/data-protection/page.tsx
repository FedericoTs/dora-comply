/**
 * Data Protection (GDPR) Dashboard
 *
 * Unified GDPR compliance management with tabbed interface:
 * - Overview: Stats and quick actions
 * - Processing Activities: RoPA (Article 30)
 * - Impact Assessments: DPIAs (Article 35)
 * - Data Subject Requests: DSRs (Articles 15-22)
 * - Data Breaches: Breach log (Articles 33-34)
 */

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Users,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GDPRDashboard } from '@/components/gdpr/gdpr-dashboard';
import { ProcessingActivitiesList } from '@/components/gdpr/processing-activities-list';
import { DPIAList } from '@/components/gdpr/dpia-list';
import { DSRList } from '@/components/gdpr/dsr-list';
import { BreachesList } from '@/components/gdpr/breaches-list';

export const metadata = {
  title: 'Data Protection | GDPR Compliance',
  description: 'GDPR compliance dashboard - Processing activities, DPIAs, DSRs, and breach management',
};

async function getOrganizationId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) redirect('/onboarding');

  return profile.organization_id;
}

function ListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="h-10 w-40 bg-muted rounded" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-24 bg-muted rounded-lg" />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export default async function DataProtectionPage() {
  const organizationId = await getOrganizationId();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Protection</h1>
          <p className="text-muted-foreground">
            GDPR compliance management - processing activities, impact assessments, and data subject rights
          </p>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="dpias" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            DPIAs
          </TabsTrigger>
          <TabsTrigger value="dsr" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            DSRs
          </TabsTrigger>
          <TabsTrigger value="breaches" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Breaches
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Suspense fallback={<DashboardSkeleton />}>
            <GDPRDashboard organizationId={organizationId} />
          </Suspense>
        </TabsContent>

        {/* Processing Activities Tab */}
        <TabsContent value="processing">
          <Suspense fallback={<ListSkeleton />}>
            <ProcessingActivitiesList organizationId={organizationId} />
          </Suspense>
        </TabsContent>

        {/* DPIAs Tab */}
        <TabsContent value="dpias">
          <Suspense fallback={<ListSkeleton />}>
            <DPIAList organizationId={organizationId} />
          </Suspense>
        </TabsContent>

        {/* DSRs Tab */}
        <TabsContent value="dsr">
          <Suspense fallback={<ListSkeleton />}>
            <DSRList organizationId={organizationId} />
          </Suspense>
        </TabsContent>

        {/* Breaches Tab */}
        <TabsContent value="breaches">
          <Suspense fallback={<ListSkeleton />}>
            <BreachesList organizationId={organizationId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
