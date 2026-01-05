/**
 * SOC 2 Analysis Page - World-Class Redesign
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
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Network,
  FileText,
  Calendar,
  Award,
  Target,
  Info,
  Eye,
} from 'lucide-react';
import { PageBreadcrumb } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Client components for charts, export, and evidence view
import { SOC2AnalysisClient } from './soc2-analysis-client';
import { ExportButtons } from './export-buttons';
import { EvidenceViewTab } from './evidence-view-tab';

// New DORA compliance components
import {
  DORAComplianceDashboard,
  MaturityLevelBadge,
  ComplianceStatusBadge,
  VerificationChecklist,
} from '@/components/compliance';
import { calculateDORACompliance } from '@/lib/compliance/dora-calculator';
import type { DORAComplianceResult } from '@/lib/compliance/dora-types';

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

// Types for parsed SOC 2 data
interface ParsedControl {
  controlId: string;
  controlArea: string;
  tscCategory: string;
  description: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  testingProcedure?: string;
  exceptionDescription?: string;
  location?: string;
  pageRef?: number;
  confidence: number;
}

interface ParsedException {
  controlId: string;
  controlArea?: string;
  exceptionDescription: string;
  exceptionType?: string;
  managementResponse?: string;
  remediationDate?: string;
  impact: 'low' | 'medium' | 'high';
  location?: string;
  pageRef?: number;
}

interface ParsedSubserviceOrg {
  name: string;
  serviceDescription: string;
  inclusionMethod: 'inclusive' | 'carve_out';
  controlsSupported: string[];
  hasOwnSoc2?: boolean;
  location?: string;
  pageRef?: number;
}

interface ParsedCUEC {
  id?: string;
  description: string;
  relatedControl?: string;
  customerResponsibility: string;
  category?: string;
  location?: string;
  pageRef?: number;
}

interface ParsedSOC2 {
  id: string;
  document_id: string;
  report_type: 'type1' | 'type2';
  audit_firm: string;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  period_start: string;
  period_end: string;
  criteria: string[];
  system_description: string;
  controls: ParsedControl[];
  exceptions: ParsedException[];
  subservice_orgs: ParsedSubserviceOrg[];
  cuecs: ParsedCUEC[];
  confidence_scores: {
    overall: number;
    metadata: number;
    controls: number;
    exceptions: number;
    subserviceOrgs: number;
    cuecs: number;
  };
  created_at: string;
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

  // Fetch document and parsed SOC 2 data
  const [{ data: document }, { data: parsedSoc2 }] = await Promise.all([
    supabase
      .from('documents')
      .select('id, filename, vendor_id, storage_path, created_at, vendors(id, name)')
      .eq('id', id)
      .single(),
    supabase.from('parsed_soc2').select('*').eq('document_id', id).single(),
  ]);

  if (!document || !parsedSoc2) {
    notFound();
  }

  // Generate signed URL for PDF viewing (valid for 1 hour)
  // Using service role client to bypass storage RLS (safe in server component)
  let pdfUrl: string | null = null;
  if (document.storage_path) {
    try {
      const storageClient = createServiceRoleClient();
      const { data: signedUrlData, error: signedUrlError } = await storageClient.storage
        .from('documents')
        .createSignedUrl(document.storage_path, 3600);

      if (signedUrlError) {
        console.error('[soc2-analysis] Signed URL error:', signedUrlError.message);
      }
      pdfUrl = signedUrlData?.signedUrl || null;
    } catch (err) {
      console.error('[soc2-analysis] Failed to create signed URL:', err);
    }
  }

  const analysis = parsedSoc2 as unknown as ParsedSOC2;
  const vendorData = document.vendors as unknown;
  const vendor = (Array.isArray(vendorData) ? vendorData[0] : vendorData) as { id: string; name: string } | null;

  // Calculate stats
  const controls = analysis.controls || [];
  const exceptions = analysis.exceptions || [];
  const subserviceOrgs = analysis.subservice_orgs || [];
  const cuecs = analysis.cuecs || [];

  const controlsEffective = controls.filter((c) => c.testResult === 'operating_effectively').length;
  const controlsWithException = controls.filter((c) => c.testResult === 'exception').length;
  const controlsNotTested = controls.filter((c) => c.testResult === 'not_tested').length;
  const totalControls = controls.length;
  const effectivenessRate = totalControls > 0 ? Math.round((controlsEffective / totalControls) * 100) : 0;

  // Calculate DORA coverage from controls (simplified version - full calculation in client)
  const calculateDORACoverage = () => {
    const coverageByPillar = {
      ICT_RISK: 0,
      INCIDENT: 0,
      TESTING: 0,  // Fixed: was 'RESILIENCE', should match DORAPillar type
      TPRM: 0,
      SHARING: 0,
    };

    // Normalize TSC category names from database format to standard TSC codes
    const normalizeTscCategory = (category: string): string => {
      const upper = category.toUpperCase();
      // Map full names to abbreviations
      const nameMapping: Record<string, string> = {
        'AVAILABILITY': 'A',
        'CONFIDENTIALITY': 'C',
        'PROCESSING_INTEGRITY': 'PI',
        'PRIVACY': 'P',
      };
      if (nameMapping[upper]) return nameMapping[upper];
      // For CC categories, keep the full code (CC1, CC6, etc.)
      if (upper.startsWith('CC')) return upper;
      return upper;
    };

    // Count controls per TSC category (keeping full category codes)
    const categoryCount: Record<string, { total: number; effective: number }> = {};
    for (const control of controls) {
      const cat = normalizeTscCategory(control.tscCategory);
      if (!categoryCount[cat]) categoryCount[cat] = { total: 0, effective: 0 };
      categoryCount[cat].total++;
      if (control.testResult === 'operating_effectively') {
        categoryCount[cat].effective++;
      }
    }

    // Map to DORA pillars - each pillar maps to specific TSC categories
    const pillarMapping: Record<string, string[]> = {
      ICT_RISK: ['CC1', 'CC3', 'CC4', 'CC5', 'CC6', 'CC7', 'CC8'],
      INCIDENT: ['CC7'],
      TESTING: ['A', 'CC7', 'CC9'],  // Fixed: was 'RESILIENCE', should match DORAPillar type
      TPRM: ['CC9', 'C'],
      SHARING: ['CC2', 'CC5'], // Communication & monitoring activities support information sharing
    };

    for (const [pillar, categories] of Object.entries(pillarMapping)) {
      if (categories.length === 0) continue;
      let pillarScore = 0;
      let catCount = 0;
      for (const cat of categories) {
        // Check for exact match or prefix match (e.g., "CC6" matches category count for "CC6")
        const matchingCats = Object.keys(categoryCount).filter(
          k => k === cat || k.startsWith(cat)
        );
        for (const matchCat of matchingCats) {
          if (categoryCount[matchCat]) {
            const catScore = categoryCount[matchCat].total > 0
              ? (categoryCount[matchCat].effective / categoryCount[matchCat].total) * 100
              : 0;
            pillarScore += catScore;
            catCount++;
          }
        }
      }
      coverageByPillar[pillar as keyof typeof coverageByPillar] = catCount > 0 ? Math.round(pillarScore / catCount) : 0;
    }

    const overall = Object.values(coverageByPillar).reduce((a, b) => a + b, 0) / 5;
    const gaps = Object.entries(coverageByPillar)
      .filter(([_, score]) => score < 50)
      .map(([pillar]) => pillar);

    return { overall: Math.round(overall), byPillar: coverageByPillar, gaps };
  };

  const doraCoverage = calculateDORACoverage();

  // Calculate DORA compliance using the new maturity-based system
  const doraCompliance: DORAComplianceResult = calculateDORACompliance(
    vendor?.id || 'unknown',
    vendor?.name || 'Unknown Vendor',
    {
      id: analysis.id,
      document_id: analysis.document_id,
      report_type: analysis.report_type,
      audit_firm: analysis.audit_firm,
      opinion: analysis.opinion,
      period_start: analysis.period_start,
      period_end: analysis.period_end,
      controls: controls.map(c => ({
        id: c.controlId,
        category: c.tscCategory,
        description: c.description,
        testResult: c.testResult,
        pageRef: c.pageRef,
      })),
      exceptions: exceptions.map(e => ({
        controlId: e.controlId,
        description: e.exceptionDescription,
      })),
      cuecs: cuecs.map(c => ({
        id: c.id || '',
        description: c.description,
      })),
      subservice_orgs: subserviceOrgs.map(s => ({
        name: s.name,
        services: s.serviceDescription,
      })),
      confidence_score: analysis.confidence_scores?.overall || 0.85,
    },
    { id, name: document.filename, type: 'soc2' }
  );

  // Group controls by TSC category
  const controlsByCategory = controls.reduce<Record<string, ParsedControl[]>>((acc, control) => {
    const cat = control.tscCategory || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(control);
    return acc;
  }, {});

  const opinionConfig = {
    unqualified: { label: 'Unqualified Opinion', color: 'bg-success text-white', icon: CheckCircle2 },
    qualified: { label: 'Qualified Opinion', color: 'bg-warning text-white', icon: AlertTriangle },
    adverse: { label: 'Adverse Opinion', color: 'bg-destructive text-white', icon: XCircle },
  };

  const opinion = opinionConfig[analysis.opinion];

  // Build breadcrumb segments based on navigation context
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

        {/* Executive Summary Header */}
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background via-background to-muted/30 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-info/5 rounded-full translate-y-24 -translate-x-24" />

          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Report Info */}
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">SOC 2 Type {analysis.report_type === 'type2' ? 'II' : 'I'} Analysis</h1>
                  <Badge className={cn(opinion.color, 'gap-1')}>
                    <opinion.icon className="h-3 w-3" />
                    {opinion.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-xl">
                  {document.filename}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {vendor && (
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {vendor.name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(analysis.period_start).toLocaleDateString()} - {new Date(analysis.period_end).toLocaleDateString()}
                  </Badge>
                  {analysis.criteria?.map((c) => (
                    <Badge key={c} variant="secondary" className="capitalize">
                      {c.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 lg:gap-6">
              <div className="text-center">
                <MaturityLevelBadge level={doraCompliance.overallMaturity} size="lg" showDescription />
                <div className="text-xs text-muted-foreground mt-1">DORA Readiness</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">{effectivenessRate}%</div>
                <div className="text-xs text-muted-foreground">SOC 2 Effective</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{totalControls}</div>
                <div className="text-xs text-muted-foreground">Controls</div>
              </div>
              <div className="text-center">
                <div className={cn('text-3xl font-bold', controlsWithException > 0 ? 'text-warning' : 'text-success')}>
                  {controlsWithException}
                </div>
                <div className="text-xs text-muted-foreground">Exceptions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-info">{subserviceOrgs.length}</div>
                <div className="text-xs text-muted-foreground">4th Parties</div>
              </div>
            </div>
          </div>
        </div>

        {/* DORA Coverage + Control Status Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* DORA Coverage Chart (Client Component) */}
          <SOC2AnalysisClient
            doraCoverage={doraCoverage}
            controlsEffective={controlsEffective}
            controlsWithException={controlsWithException}
            controlsNotTested={controlsNotTested}
            controls={controls}
          />
        </div>

        {/* Report Metadata Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Details
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">AI Confidence</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={analysis.confidence_scores?.overall * 100 || 0}
                        className="h-2 w-20"
                      />
                      <span className="text-sm font-medium">
                        {Math.round((analysis.confidence_scores?.overall || 0) * 100)}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI extraction confidence score</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Audit Firm</p>
                <p className="mt-1 font-medium">{analysis.audit_firm}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Audit Period</p>
                <p className="mt-1">
                  {new Date(analysis.period_start).toLocaleDateString()} - {new Date(analysis.period_end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Parsed On</p>
                <p className="mt-1">{new Date(analysis.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Report Type</p>
                <p className="mt-1">SOC 2 Type {analysis.report_type === 'type2' ? 'II' : 'I'}</p>
              </div>
            </div>
            {analysis.system_description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">System Description</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{analysis.system_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Tabs */}
        <Tabs defaultValue="controls" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
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
            <TabsTrigger value="verify" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Verify</span>
            </TabsTrigger>
          </TabsList>

          {/* Evidence View Tab - 10X Differentiator */}
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
            {Object.entries(controlsByCategory).map(([category, categoryControls]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{category}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {categoryControls.filter(c => c.testResult === 'operating_effectively').length}/{categoryControls.length} effective
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-40">Status</TableHead>
                        <TableHead className="w-24 text-right">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryControls.map((control) => (
                        <TableRow key={control.controlId}>
                          <TableCell className="font-mono text-sm font-medium">{control.controlId}</TableCell>
                          <TableCell>
                            <p className="line-clamp-2 text-sm">{control.description}</p>
                          </TableCell>
                          <TableCell>
                            {control.testResult === 'operating_effectively' && (
                              <Badge variant="outline" className="border-success text-success gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Effective
                              </Badge>
                            )}
                            {control.testResult === 'exception' && (
                              <Badge variant="outline" className="border-warning text-warning gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Exception
                              </Badge>
                            )}
                            {control.testResult === 'not_tested' && (
                              <Badge variant="outline" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Not Tested
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-muted-foreground">{Math.round(control.confidence * 100)}%</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Exceptions Tab */}
          <TabsContent value="exceptions" className="space-y-4">
            {exceptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
                  <p className="text-lg font-medium">No Exceptions Found</p>
                  <p className="text-sm text-muted-foreground">All tested controls are operating effectively</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exceptions.map((exception, idx) => (
                  <Card
                    key={idx}
                    className={cn(
                      'border-l-4',
                      exception.impact === 'high' ? 'border-l-destructive' :
                      exception.impact === 'medium' ? 'border-l-warning' : 'border-l-muted-foreground'
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="font-mono">{exception.controlId}</span>
                          {exception.controlArea && (
                            <span className="text-muted-foreground font-normal">- {exception.controlArea}</span>
                          )}
                        </CardTitle>
                        <Badge
                          variant={exception.impact === 'high' ? 'destructive' : exception.impact === 'medium' ? 'outline' : 'secondary'}
                          className={exception.impact === 'medium' ? 'border-warning text-warning' : ''}
                        >
                          {exception.impact} impact
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Exception Description</p>
                        <p className="text-sm">{exception.exceptionDescription}</p>
                      </div>
                      {exception.managementResponse && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Management Response</p>
                          <p className="text-sm text-muted-foreground">{exception.managementResponse}</p>
                        </div>
                      )}
                      {exception.remediationDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Remediation: {new Date(exception.remediationDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Subservice Organizations Tab */}
          <TabsContent value="subservice" className="space-y-4">
            {subserviceOrgs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Subservice Organizations</p>
                  <p className="text-sm text-muted-foreground">This service organization manages all services in-house</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-info/5 border-info/20">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-info mt-0.5" />
                      <div>
                        <p className="font-medium text-info">Fourth-Party Risk (DORA Art. 28)</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          DORA requires financial entities to monitor ICT service provider supply chains.
                          Subservice organizations listed here may require additional due diligence.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid gap-4 md:grid-cols-2">
                  {subserviceOrgs.map((org, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-info" />
                            {org.name}
                          </CardTitle>
                          <Badge
                            variant={org.inclusionMethod === 'carve_out' ? 'outline' : 'secondary'}
                            className={org.inclusionMethod === 'carve_out' ? 'border-warning text-warning' : ''}
                          >
                            {org.inclusionMethod === 'carve_out' ? 'Carved Out' : 'Inclusive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{org.serviceDescription}</p>
                        {org.controlsSupported && org.controlsSupported.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Controls Supported</p>
                            <div className="flex flex-wrap gap-1">
                              {org.controlsSupported.slice(0, 5).map((c) => (
                                <Badge key={c} variant="outline" className="font-mono">{c}</Badge>
                              ))}
                              {org.controlsSupported.length > 5 && (
                                <Badge variant="outline">+{org.controlsSupported.length - 5} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {org.hasOwnSoc2 && (
                          <div className="flex items-center gap-2 text-sm text-success">
                            <Award className="h-4 w-4" />
                            Has own SOC 2 report
                          </div>
                        )}
                        {org.inclusionMethod === 'carve_out' && (
                          <div className="flex items-center gap-2 text-sm text-warning">
                            <AlertTriangle className="h-4 w-4" />
                            Carved out - requires separate assurance
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* CUECs Tab */}
          <TabsContent value="cuecs" className="space-y-4">
            {cuecs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No CUECs Identified</p>
                  <p className="text-sm text-muted-foreground">No complementary user entity controls were found in this report</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">Customer Responsibilities</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          These controls must be implemented by your organization to ensure the service provider&apos;s
                          controls operate effectively. Track implementation status to maintain compliance.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Complementary User Entity Controls</CardTitle>
                    <CardDescription>Controls that must be implemented by your organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">ID</TableHead>
                          <TableHead>Customer Responsibility</TableHead>
                          <TableHead className="w-32">Related Control</TableHead>
                          <TableHead className="w-32">Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cuecs.map((cuec, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{cuec.id || `CUEC-${idx + 1}`}</TableCell>
                            <TableCell>
                              <p className="text-sm">{cuec.customerResponsibility}</p>
                              {cuec.description !== cuec.customerResponsibility && (
                                <p className="text-xs text-muted-foreground mt-1">{cuec.description}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {cuec.relatedControl && (
                                <Badge variant="outline" className="font-mono">{cuec.relatedControl}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {cuec.category && (
                                <Badge variant="secondary" className="capitalize">{cuec.category.replace('_', ' ')}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* DORA Mapping Tab - Now with Maturity-Based Scoring */}
          <TabsContent value="dora" className="space-y-4">
            <DORAComplianceDashboard
              compliance={doraCompliance}
              onPillarClick={(pillar) => {
                // Could scroll to pillar details or open modal
                console.log('Pillar clicked:', pillar);
              }}
              onGapClick={(requirementId) => {
                // Could open gap detail modal
                console.log('Gap clicked:', requirementId);
              }}
            />
          </TabsContent>

          {/* Verification Tab - Ensures extraction accuracy */}
          <TabsContent value="verify" className="space-y-4">
            <VerificationChecklist
              documentId={id}
              documentName={document.filename}
              extractionConfidence={(analysis.confidence_scores?.overall || 0.85) * 100}
              extractedData={{
                controlCount: totalControls,
                exceptionCount: exceptions.length,
                opinion: analysis.opinion,
                auditFirm: analysis.audit_firm,
                reportType: analysis.report_type === 'type2' ? 'SOC 2 Type II' : 'SOC 2 Type I',
                periodStart: new Date(analysis.period_start).toLocaleDateString(),
                periodEnd: new Date(analysis.period_end).toLocaleDateString(),
                subserviceOrgs: subserviceOrgs.map(s => ({
                  name: s.name,
                  services: s.serviceDescription,
                })),
                sampleControls: controls.slice(0, 5).map(c => ({
                  id: c.controlId,
                  category: c.tscCategory,
                  description: c.description,
                  pageRef: c.pageRef,
                })),
              }}
              onVerify={(result) => {
                console.log('Verification result:', result);
                // Could save verification to database
              }}
              onRequestReparse={() => {
                console.log('Re-parse requested');
                // Could trigger document re-parsing
              }}
              onReportIssue={(issue) => {
                console.log('Issue reported:', issue);
                // Could open support ticket
              }}
              onViewInPdf={(pageNumber) => {
                console.log('View in PDF:', pageNumber);
                // Could switch to evidence tab and scroll to page
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
