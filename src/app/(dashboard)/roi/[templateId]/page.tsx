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
import { EditableTableWrapper } from './components/editable-table-wrapper';
import { ValidationPanel } from './components/validation-panel';
import { FieldMapper } from './components/field-mapper';
import { ExportButton } from './components/export-button';
import { TemplateNavigation, TemplateProgressBar } from './components/template-navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ChevronLeft,
  FileSpreadsheet,
  Edit3,
  Wand2,
  Upload,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

// Convert URL param to template ID (b_01_01 -> B_01.01)
function parseTemplateId(param: string): RoiTemplateId | null {
  // URL format: b_01_01 -> Template format: B_01.01
  // Split by underscore: ['b', '01', '01']
  // Reassemble: B_01.01
  const parts = param.toUpperCase().split('_');
  if (parts.length === 3) {
    const normalized = `${parts[0]}_${parts[1]}.${parts[2]}`;
    if (normalized in ROI_TEMPLATES) {
      return normalized as RoiTemplateId;
    }
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
  const rawColumns = getColumnMappings(templateId);

  // Strip non-serializable properties (transform functions) before passing to Client Components
  // Functions cannot be passed from Server Components to Client Components
  const columns = rawColumns.map(({ transform, ...rest }) => rest);

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

      {/* Template Progress Bar - shows position in workflow */}
      <TemplateProgressBar currentTemplateId={templateId} />

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Records:</span>
          <Badge>{count}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Columns:</span>
          <Badge variant="outline">{columns.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Required:</span>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            {columns.filter(c => c.required).length} fields
          </Badge>
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

      {/* Empty State for templates with no data */}
      {count === 0 ? (
        <Card className="card-premium">
          <CardContent className="pt-6">
            <EmptyState
              icon={FileSpreadsheet}
              title={`No data in ${templateId} yet`}
              description={`This template is empty. Populate it using AI from uploaded documents, import from a CSV, or add records manually.`}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <Link href="/roi">
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                      <Wand2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium text-sm">AI Population</p>
                    <p className="text-xs text-muted-foreground mt-1">Extract from documents</p>
                  </CardContent>
                </Link>
              </Card>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <Link href="/documents">
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium text-sm">Upload Documents</p>
                    <p className="text-xs text-muted-foreground mt-1">Contracts, certs, etc.</p>
                  </CardContent>
                </Link>
              </Card>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                    <PlusCircle className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">Add Manually</p>
                  <p className="text-xs text-muted-foreground mt-1">Enter data directly</p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                This template has {columns.length} columns, {columns.filter(c => c.required).length} required fields
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground border rounded-lg px-4 py-2 bg-muted/30">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200" />
              <span>Required field</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-amber-700 font-medium">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Missing
              </span>
              <span>Required value missing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
              <span>Validation error</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-muted/60 border border-muted-foreground/30" />
              <span>Computed (read-only)</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Edit3 className="h-3 w-3" />
              <span className="font-medium">Inline editing enabled</span>
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
              <EditableTableWrapper
                templateId={templateId}
                initialData={data}
                columns={columns}
                validationErrors={errorMap}
              />
            </div>

            {/* Sidebar - field mapping */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-medium">ESA Mapping</h2>
              <FieldMapper columns={columns} />
            </div>
          </div>
        </>
      )}

      {/* Template Navigation */}
      <TemplateNavigation
        currentTemplateId={templateId}
        className="mt-8"
      />
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
