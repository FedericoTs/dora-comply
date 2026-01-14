/**
 * Test Detail Page
 *
 * View and manage individual resilience tests with findings
 */

import { Suspense } from 'react';
import { getTestById } from '@/lib/testing/queries';
import { PageSkeleton, TestDetailContent } from './components';

interface TestDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TestDetailPageProps) {
  const { id } = await params;
  const { data: test } = await getTestById(id);

  return {
    title: test ? `${test.name} | Resilience Testing` : 'Test Not Found',
    description: test?.description || 'View test details and findings',
  };
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestDetailContent id={id} />
    </Suspense>
  );
}
