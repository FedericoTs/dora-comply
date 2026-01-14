/**
 * SOC 2 Analysis Page
 *
 * Comprehensive view of SOC 2 parsed results with:
 * - Executive summary with key metrics
 * - DORA coverage radar chart
 * - Control status visualization
 * - Gap analysis with remediation guidance
 * - Detailed tabs for controls, exceptions, subservice orgs, CUECs
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Shield,
  AlertTriangle,
  Network,
  Users,
  Target,
  Eye,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { PageBreadcrumb } from '@/components/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Client and feature components
import { SOC2AnalysisClient } from './soc2-analysis-client';
import { ExportButtons } from './export-buttons';
import { EvidenceViewTab } from './evidence-view-tab';

// SOC 2 components
import {
  Soc2ExecutiveSummary,
  Soc2ReportDetailsCard,
  ControlsTabContent,
  ExceptionsTabContent,
  SubserviceOrgsTabContent,
  CuecsTabContent,
  RoiPopulationTab,
} from '@/components/soc2';

// DORA compliance components
import {
  DORAComplianceDashboard,
  VerificationChecklist,
} from '@/components/compliance';

// Types and services
import type { ParsedSOC2 } from '@/lib/soc2/soc2-types';
import { calculateControlStats } from '@/lib/soc2/soc2-types';
import { calculateDORAFromDB, type DBParsedSOC2 } from '@/lib/compliance/dora-data-service';

interface SOC2AnalysisPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: SOC2AnalysisPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: document } = await supabase
    .from('documents')
    .select('filename')
    .eq('id', id)
    .single();

  if (!document) {
    return { title: 'SOC 2 Analysis Not Found | DORA Comply' };
  }

  return {
    title: `SOC 2 Analysis - ${document.filename} | DORA Comply`,
    description: `AI-extracted SOC 2 analysis for ${document.filename} with DORA compliance mapping`,
  };
}

export default async function SOC2AnalysisPage({ params, searchParams }: SOC2AnalysisPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // Extract navigation context
  const fromVendor = resolvedSearchParams.from === 'vendor';
  const vendorId = typeof resolvedSearchParams.vendorId === 'string' ? resolvedSearchParams.vendorId : undefined;
  const vendorName = typeof resolvedSearchParams.vendorName === 'string' ? resolvedSearchParams.vendorName : undefined;
  const documentName = typeof resolvedSearchParams.documentName === 'string' ? resolvedSearchParams.documentName : undefined;

  // Fetch document with vendor
  const { getDocumentWithVendor } = await import('@/lib/documents/queries');
  const documentWithVendor = await getDocumentWithVendor(id);

  if (!documentWithVendor) {
    notFound();
  }

  // Fetch parsed SOC2 data
  const { data: parsedSoc2 } = await supabase
    .from('parsed_soc2')
    .select('*')
    .eq('document_id', id)
    .single();

  if (!parsedSoc2) {
    notFound();
  }

  // Map to expected document format
  const document = {
    id: documentWithVendor.id,
    filename: documentWithVendor.filename,
    vendor_id: documentWithVendor.vendor_id,
    storage_path: documentWithVendor.storage_path,
    created_at: documentWithVendor.created_at,
    organization_id: documentWithVendor.organization_id,
    vendors: documentWithVendor.vendor ? { id: documentWithVendor.vendor.id, name: documentWithVendor.vendor.name } : null,
  };

  // Generate signed URL for PDF viewing
  let pdfUrl: string | null = null;
  if (document.storage_path) {
    try {
      const storageClient = createServiceRoleClient();
      const { data: signedUrlData } = await storageClient.storage
        .from('documents')
        .createSignedUrl(document.storage_path, 3600);
      pdfUrl = signedUrlData?.signedUrl || null;
    } catch {
      // PDF URL generation failed, continue without it
    }
  }

  const analysis = parsedSoc2 as unknown as ParsedSOC2;
  const vendorData = document.vendors as unknown;
  const vendor = (Array.isArray(vendorData) ? vendorData[0] : vendorData) as { id: string; name: string } | null;

  // Extract data arrays
  const controls = analysis.controls || [];
  const exceptions = analysis.exceptions || [];
  const subserviceOrgs = analysis.subservice_orgs || [];
  const cuecs = analysis.cuecs || [];

  // Calculate stats
  const controlStats = calculateControlStats(controls);

  // Calculate DORA compliance
  const doraCompliance = calculateDORAFromDB(
    vendor?.id || 'unknown',
    vendor?.name || 'Unknown Vendor',
    analysis as unknown as DBParsedSOC2,
    { id, name: document.filename, type: 'soc2' }
  );

  // Transform for DORA charts
  const doraCoverage = {
    overall: doraCompliance.overallPercentage,
    byPillar: {
      ICT_RISK: doraCompliance.pillars.ICT_RISK.percentageScore,
      INCIDENT: doraCompliance.pillars.INCIDENT.percentageScore,
      TESTING: doraCompliance.pillars.TESTING.percentageScore,
      TPRM: doraCompliance.pillars.TPRM.percentageScore,
      SHARING: doraCompliance.pillars.SHARING.percentageScore,
    },
    gaps: Object.entries(doraCompliance.pillars)
      .filter(([, pillar]) => pillar.status !== 'compliant')
      .map(([key]) => key),
  };

  // Build breadcrumb
  const buildDocumentHref = () => {
    if (fromVendor && vendorId) {
      const params = new URLSearchParams();
      params.set('from', 'vendor');
      params.set('vendorId', vendorId);
      if (vendorName) params.set('vendorName', vendorName);
      return `/documents/${id}?${params.toString()}`;
    }
    return `/documents/${id}`;
  };

  const breadcrumbSegments = fromVendor && vendorId
    ? [
        { label: 'Vendors', href: '/vendors' },
        { label: vendorName || vendor?.name || 'Vendor', href: `/vendors/${vendorId}?tab=documents` },
        { label: documentName || document.filename, href: buildDocumentHref() },
      ]
    : [
        { label: 'Documents', href: '/documents' },
        { label: document.filename, href: `/documents/${id}` },
      ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <PageBreadcrumb
            segments={breadcrumbSegments}
            currentPage="SOC 2 Analysis"
            backHref={buildDocumentHref()}
            backLabel="Back to Document"
          />
          <ExportButtons documentId={id} documentName={document.filename} />
        </div>

        {/* Executive Summary */}
        <Soc2ExecutiveSummary
          reportType={analysis.report_type}
          opinion={analysis.opinion}
          filename={document.filename}
          vendor={vendor}
          periodStart={analysis.period_start}
          periodEnd={analysis.period_end}
          criteria={analysis.criteria}
          doraCompliance={doraCompliance}
          exceptionsCount={exceptions.length}
          subserviceOrgsCount={subserviceOrgs.length}
        />

        {/* DORA Coverage + Evidence Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SOC2AnalysisClient
            doraCoverage={doraCoverage}
            doraEvidence={{
              sufficient: doraCompliance.evidenceSummary.sufficient,
              partial: doraCompliance.evidenceSummary.partial,
              insufficient: doraCompliance.evidenceSummary.insufficient,
              total: doraCompliance.evidenceSummary.total,
              overallPercentage: doraCompliance.overallPercentage,
              criticalGapsCount: doraCompliance.criticalGaps.length,
            }}
          />
        </div>

        {/* Report Details */}
        <Soc2ReportDetailsCard
          auditFirm={analysis.audit_firm}
          periodStart={analysis.period_start}
          periodEnd={analysis.period_end}
          reportType={analysis.report_type}
          createdAt={analysis.created_at}
          systemDescription={analysis.system_description}
          confidenceScores={analysis.confidence_scores}
        />

        {/* Detailed Tabs */}
        <Tabs defaultValue="controls" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="evidence" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Evidence</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Controls</span>
              <Badge variant="secondary" className="ml-1">{controls.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Exceptions</span>
              <Badge variant={exceptions.length > 0 ? 'destructive' : 'secondary'} className="ml-1">
                {exceptions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="subservice" className="gap-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">4th Parties</span>
              <Badge variant="secondary" className="ml-1">{subserviceOrgs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cuecs" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">CUECs</span>
              <Badge variant="secondary" className="ml-1">{cuecs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="dora" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">DORA</span>
            </TabsTrigger>
            <TabsTrigger value="roi" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">RoI</span>
            </TabsTrigger>
            <TabsTrigger value="verify" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Verify</span>
            </TabsTrigger>
          </TabsList>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="space-y-4">
            <Card className="bg-primary/5 border-primary/20 mb-4">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Evidence Traceability View</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click on any extracted control, exception, or subservice organization to see exactly
                      where it was found in the source document. This side-by-side view ensures full
                      auditability and DORA compliance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <EvidenceViewTab
              pdfUrl={pdfUrl}
              controls={controls}
              exceptions={exceptions}
              subserviceOrgs={subserviceOrgs}
              cuecs={cuecs}
              documentId={id}
              documentName={document.filename}
            />
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-4">
            <ControlsTabContent controls={controls} />
          </TabsContent>

          {/* Exceptions Tab */}
          <TabsContent value="exceptions" className="space-y-4">
            <ExceptionsTabContent exceptions={exceptions} />
          </TabsContent>

          {/* Subservice Organizations Tab */}
          <TabsContent value="subservice" className="space-y-4">
            <SubserviceOrgsTabContent subserviceOrgs={subserviceOrgs} />
          </TabsContent>

          {/* CUECs Tab */}
          <TabsContent value="cuecs" className="space-y-4">
            <CuecsTabContent cuecs={cuecs} />
          </TabsContent>

          {/* DORA Mapping Tab */}
          <TabsContent value="dora" className="space-y-4">
            <DORAComplianceDashboard compliance={doraCompliance} />
          </TabsContent>

          {/* RoI Population Tab */}
          <TabsContent value="roi" className="space-y-4">
            <RoiPopulationTab
              documentId={id}
              vendorName={vendor?.name}
              vendorId={vendor?.id}
            />
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verify" className="space-y-4">
            <VerificationChecklist
              documentId={id}
              documentName={document.filename}
              extractionConfidence={(analysis.confidence_scores?.overall || 0.85) * 100}
              extractedData={{
                controlCount: controlStats.total,
                exceptionCount: exceptions.length,
                opinion: analysis.opinion,
                auditFirm: analysis.audit_firm,
                reportType: analysis.report_type === 'type2' ? 'SOC 2 Type II' : 'SOC 2 Type I',
                periodStart: new Date(analysis.period_start).toLocaleDateString(),
                periodEnd: new Date(analysis.period_end).toLocaleDateString(),
                subserviceOrgs: subserviceOrgs.map((s) => ({
                  name: s.name,
                  services: s.serviceDescription,
                })),
                sampleControls: controls.slice(0, 5).map((c) => ({
                  id: c.controlId,
                  category: c.tscCategory,
                  description: c.description,
                  pageRef: c.pageRef,
                })),
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
