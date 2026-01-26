import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProcessingActivitiesList } from '@/components/gdpr/processing-activities-list';

export const metadata = {
  title: 'Processing Activities | GDPR Compliance',
  description: 'Record of Processing Activities (RoPA) - Article 30 GDPR compliance',
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

export default async function ProcessingActivitiesPage() {
  const organizationId = await getOrganizationId();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Processing Activities</h1>
        <p className="text-muted-foreground mt-1">
          Record of Processing Activities (RoPA) as required by GDPR Article 30
        </p>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <ProcessingActivitiesList organizationId={organizationId} />
      </Suspense>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="h-10 w-40 bg-muted rounded" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 bg-muted rounded-lg" />
      ))}
    </div>
  );
}
