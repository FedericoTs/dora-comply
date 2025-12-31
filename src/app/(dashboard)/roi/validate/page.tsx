/**
 * RoI Validation Page
 *
 * Full validation view with AI-powered suggestions and fix wizard
 */

import { Suspense } from 'react';
import { validateRoi, fetchTemplateData, type RoiTemplateId } from '@/lib/roi';
import { ValidationPageClient } from './validation-page-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Validate RoI | DORA Comply',
  description: 'Validate Register of Information data against ESA rules',
};

async function ValidationContent() {
  // Fetch data for all templates
  const templates: RoiTemplateId[] = [
    'B_01.01', 'B_01.02', 'B_01.03',
    'B_02.01', 'B_02.02', 'B_02.03',
    'B_03.01', 'B_03.02', 'B_03.03',
    'B_04.01', 'B_05.01', 'B_05.02',
    'B_06.01', 'B_07.01',
  ];

  const templateData: Record<RoiTemplateId, Record<string, unknown>[]> = {} as Record<RoiTemplateId, Record<string, unknown>[]>;

  for (const templateId of templates) {
    const { data } = await fetchTemplateData(templateId);
    templateData[templateId] = data;
  }

  // Validate all templates
  const result = await validateRoi(templateData);

  return (
    <ValidationPageClient
      initialResult={result}
    />
  );
}

function ValidationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={<ValidationSkeleton />}>
      <ValidationContent />
    </Suspense>
  );
}
