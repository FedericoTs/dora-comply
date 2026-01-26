import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BreachesList } from '@/components/gdpr/breaches-list';

export const metadata = {
  title: 'Data Breaches | GDPR Compliance',
  description: 'Personal data breach log - Articles 33-34 GDPR compliance',
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

export default async function BreachesPage() {
  const organizationId = await getOrganizationId();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data Breaches</h1>
        <p className="text-muted-foreground mt-1">
          Log and track personal data breaches for notification compliance (Articles 33-34)
        </p>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <BreachesList organizationId={organizationId} />
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
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 bg-muted rounded-lg" />
      ))}
    </div>
  );
}
