import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getNIS2Assessments } from '@/lib/compliance/nis2-queries';
import { calculateNIS2Compliance } from '@/lib/compliance/nis2-calculator';
import { NIS2GapList, NIS2GapEmptyState } from '@/components/compliance/nis2-gap-list';

export const metadata: Metadata = {
  title: 'NIS2 Gap Analysis | DORA Comply',
  description: 'View and manage NIS2 compliance gaps',
};

export default async function NIS2GapsPage() {
  // Fetch assessments
  const result = await getNIS2Assessments();

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/nis2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NIS2 Gap Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Identify and track compliance gaps across NIS2 requirements
          </p>
        </div>
        <NIS2GapEmptyState />
      </div>
    );
  }

  const { assessments, entityType, organizationId } = result;

  // Calculate compliance to get gaps
  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/nis2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NIS2 Gap Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Identify and track compliance gaps across NIS2 requirements
          </p>
        </div>
        <NIS2GapEmptyState />
      </div>
    );
  }

  const complianceResult = calculateNIS2Compliance({
    organizationId,
    entityType,
    assessments,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/nis2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NIS2 Gap Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Identify and track compliance gaps across NIS2 requirements
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {complianceResult.totalGaps} gaps identified |{' '}
          {complianceResult.criticalGaps.length} critical
        </div>
      </div>

      {/* Gap List */}
      {complianceResult.allGaps.length > 0 ? (
        <NIS2GapList gaps={complianceResult.allGaps} />
      ) : (
        <NIS2GapEmptyState />
      )}
    </div>
  );
}
