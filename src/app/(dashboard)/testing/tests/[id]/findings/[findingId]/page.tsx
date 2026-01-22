/**
 * Finding Detail Page
 *
 * View and edit a test finding
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getFindingById, getTestById } from '@/lib/testing/queries';
import { FindingDetailContent } from './finding-detail-content';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface FindingDetailPageProps {
  params: Promise<{ id: string; findingId: string }>;
}

export async function generateMetadata({ params }: FindingDetailPageProps) {
  const { findingId } = await params;
  const { data: finding } = await getFindingById(findingId);

  return {
    title: finding ? `${finding.title} | Finding` : 'Finding Not Found',
    description: finding ? 'Finding details' : 'Finding not found',
  };
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function FindingDetailFetcher({ testId, findingId }: { testId: string; findingId: string }) {
  const [{ data: finding }, { data: test }] = await Promise.all([
    getFindingById(findingId),
    getTestById(testId),
  ]);

  if (!finding || !test) {
    notFound();
  }

  return <FindingDetailContent finding={finding} test={test} />;
}

export default async function FindingDetailPage({ params }: FindingDetailPageProps) {
  const { id: testId, findingId } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <FindingDetailFetcher testId={testId} findingId={findingId} />
    </Suspense>
  );
}
