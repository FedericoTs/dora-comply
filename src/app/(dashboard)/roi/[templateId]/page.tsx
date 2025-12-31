/**
 * RoI Template Detail Page
 *
 * Shows data, field mappings, and validation for a single template
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  fetchTemplateData,
  validateTemplate,
  getColumnMappings,
  ROI_TEMPLATES,
  type RoiTemplateId,
} from '@/lib/roi';
import { DataTable } from './components/data-table';
import { ValidationPanel } from './components/validation-panel';
import { FieldMapper } from './components/field-mapper';
import { ExportButton } from './components/export-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, FileSpreadsheet } from 'lucide-react';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

// Convert URL param to template ID (b_01_01 -> B_01.01)
function parseTemplateId(param: string): RoiTemplateId | null {
  const normalized = param.toUpperCase().replace('_', '.').replace('_', '.');
  if (normalized in ROI_TEMPLATES) {
    return normalized as RoiTemplateId;
  }
  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const templateId = parseTemplateId(resolvedParams.templateId);

  if (!templateId) {
    return { title: 'Template Not Found | DORA Comply' };
  }

  const template = ROI_TEMPLATES[templateId];
  return {
    title: `${templateId} - ${template.name} | DORA Comply`,
    description: `View and export ESA DORA template ${templateId}: ${template.description}`,
  };
}

async function TemplateDetailContent({ templateId }: { templateId: RoiTemplateId }) {
  const template = ROI_TEMPLATES[templateId];
  const columns = getColumnMappings(templateId);

  // Fetch data
  const { data, count } = await fetchTemplateData(templateId);

  // Validate data
  const validation = validateTemplate(templateId, data);

  // Build validation error map for highlighting
  const errorMap = new Map<number, Set<string>>();
  validation.errors.forEach((error) => {
    if (error.rowIndex !== undefined) {
      if (!errorMap.has(error.rowIndex)) {
        errorMap.set(error.rowIndex, new Set());
      }
      errorMap.get(error.rowIndex)?.add(error.columnCode);
    }
  });

  const errorCount = validation.errors.filter(e => e.severity === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/roi"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Register of Information
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">{templateId}</h1>
            <Badge variant="outline" className="font-mono">
              {template.esaReference}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {template.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            templateId={templateId}
            hasErrors={errorCount > 0}
            rowCount={count}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Records:</span>
          <Badge>{count}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Columns:</span>
          <Badge variant="outline">{columns.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          {validation.isValid ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge>
          ) : (
            <Badge variant="destructive">{errorCount} errors</Badge>
          )}
        </div>
      </div>

      {/* Validation Panel */}
      <ValidationPanel
        errors={validation.errors}
        isValid={validation.isValid}
      />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Data table - takes 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-medium">Template Data</h2>
          <div className="rounded-lg border overflow-hidden">
            <DataTable
              data={data}
              columns={columns}
              validationErrors={errorMap}
            />
          </div>
        </div>

        {/* Sidebar - field mapping */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-medium">ESA Mapping</h2>
          <FieldMapper columns={columns} />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>

      <Skeleton className="h-32" />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Skeleton className="h-96" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const templateId = parseTemplateId(resolvedParams.templateId);

  if (!templateId) {
    notFound();
  }

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <TemplateDetailContent templateId={templateId} />
    </Suspense>
  );
}
