/**
 * TLPT Detail Page
 *
 * View and manage TLPT engagements per DORA Article 26
 */

import { Suspense } from 'react';
import { getTLPTById } from '@/lib/testing/queries';
import { PageSkeleton, TLPTDetailContent } from './components';

interface TLPTDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TLPTDetailPageProps) {
  const { id } = await params;
  const { data: tlpt } = await getTLPTById(id);

  return {
    title: tlpt ? `${tlpt.name} | TLPT` : 'TLPT Not Found',
    description: tlpt ? 'TLPT engagement details' : 'TLPT engagement not found',
  };
}

export default async function TLPTDetailPage({ params }: TLPTDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <TLPTDetailContent id={id} />
    </Suspense>
  );
}
