import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GDPRDashboard } from '@/components/gdpr/gdpr-dashboard';

export const metadata = {
  title: 'GDPR Compliance | NIS2 & DORA Platform',
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

export default async function GDPRPage() {
  const organizationId = await getOrganizationId();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GDPR Compliance</h1>
        <p className="text-muted-foreground mt-1">
          Manage your GDPR compliance obligations including processing activities, impact assessments, and data subject rights
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <GDPRDashboard organizationId={organizationId} />
      </Suspense>
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
