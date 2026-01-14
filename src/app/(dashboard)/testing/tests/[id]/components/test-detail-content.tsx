/**
 * Test Detail Content Component
 *
 * Main content display for test detail page
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTestById } from '@/lib/testing/queries';
import { TestInfoCard } from './test-info-card';
import { FindingsTable } from './findings-table';
import { QuickStatsCard } from './quick-stats-card';
import { Article25Card } from './article25-card';

interface TestDetailContentProps {
  id: string;
}

export async function TestDetailContent({ id }: TestDetailContentProps) {
  const { data: test, error } = await getTestById(id);

  if (error || !test) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/testing" className="hover:underline">
              Resilience Testing
            </Link>
            <span>/</span>
            <Link href="/testing/tests" className="hover:underline">
              Tests
            </Link>
            <span>/</span>
            <span>{test.test_ref}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{test.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/testing/tests/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <TestInfoCard test={test} />
          <FindingsTable findings={test.findings || []} testId={id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <QuickStatsCard test={test} />
          <Article25Card testType={test.test_type} />
        </div>
      </div>
    </div>
  );
}
