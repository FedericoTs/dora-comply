/**
 * SOC 2 Analysis Page
 *
 * Full-page view of SOC 2 parsed results with:
 * - Report metadata and overview
 * - Controls table with test results
 * - Exceptions list with impact assessment
 * - Subservice organizations (4th party risk)
 * - DORA mapping and coverage analysis
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Network,
  Download,
  FileText,
  Calendar,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

interface SOC2AnalysisPageProps {
  params: Promise<{ id: string }>;
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
    description: `AI-extracted SOC 2 analysis for ${document.filename}`,
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
}

interface ParsedSubserviceOrg {
  name: string;
  serviceDescription: string;
  inclusionMethod: 'inclusive' | 'carve_out';
  controlsSupported: string[];
  hasOwnSoc2?: boolean;
  location?: string;
}

interface ParsedCUEC {
  id?: string;
  description: string;
  relatedControl?: string;
  customerResponsibility: string;
  category?: string;
  location?: string;
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

export default async function SOC2AnalysisPage({ params }: SOC2AnalysisPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch document and parsed SOC 2 data
  const [{ data: document }, { data: parsedSoc2 }] = await Promise.all([
    supabase
      .from('documents')
      .select('id, filename, vendor_id, vendors(id, name)')
      .eq('id', id)
      .single(),
    supabase.from('parsed_soc2').select('*').eq('document_id', id).single(),
  ]);

  if (!document || !parsedSoc2) {
    notFound();
  }

  const analysis = parsedSoc2 as unknown as ParsedSOC2;
  // vendors comes back as an object from the join, not an array
  const vendorData = document.vendors as unknown;
  const vendor = (Array.isArray(vendorData) ? vendorData[0] : vendorData) as { id: string; name: string } | null;

  // Calculate stats
  const controls = analysis.controls || [];
  const exceptions = analysis.exceptions || [];
  const subserviceOrgs = analysis.subservice_orgs || [];
  const cuecs = analysis.cuecs || [];

  const controlsEffective = controls.filter(
    (c) => c.testResult === 'operating_effectively'
  ).length;
  const controlsWithException = controls.filter(
    (c) => c.testResult === 'exception'
  ).length;
  const controlsNotTested = controls.filter(
    (c) => c.testResult === 'not_tested'
  ).length;

  const opinionColors = {
    unqualified: 'bg-success text-white',
    qualified: 'bg-warning text-white',
    adverse: 'bg-destructive text-white',
  };

  const opinionLabels = {
    unqualified: 'Unqualified (Clean)',
    qualified: 'Qualified',
    adverse: 'Adverse',
  };

  // Group controls by TSC category
  const controlsByCategory = controls.reduce<Record<string, ParsedControl[]>>(
    (acc, control) => {
      const cat = control.tscCategory || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(control);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/documents/${id}`}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Document
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-info/10 p-3">
            <Shield className="h-6 w-6 text-info" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">SOC 2 Analysis</h1>
            <p className="text-muted-foreground">{document.filename}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={cn(opinionColors[analysis.opinion])}>
                {opinionLabels[analysis.opinion]}
              </Badge>
              <Badge variant="outline">
                Type {analysis.report_type === 'type2' ? 'II' : 'I'}
              </Badge>
              {analysis.criteria?.map((c) => (
                <Badge key={c} variant="secondary" className="capitalize">
                  {c.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {vendor && (
          <Button variant="outline" asChild>
            <Link href={`/vendors/${vendor.id}`}>
              <Building2 className="mr-2 h-4 w-4" />
              {vendor.name}
            </Link>
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{controlsEffective}</p>
                <p className="text-sm text-muted-foreground">Operating Effectively</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{controlsWithException}</p>
                <p className="text-sm text-muted-foreground">With Exceptions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-info/10 p-3">
                <Network className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subserviceOrgs.length}</p>
                <p className="text-sm text-muted-foreground">Subservice Orgs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cuecs.length}</p>
                <p className="text-sm text-muted-foreground">User Controls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Audit Firm
              </p>
              <p className="mt-1 font-medium">{analysis.audit_firm}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Audit Period
              </p>
              <p className="mt-1">
                {new Date(analysis.period_start).toLocaleDateString()} -{' '}
                {new Date(analysis.period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                AI Confidence
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Progress
                  value={analysis.confidence_scores?.overall * 100 || 0}
                  className="h-2 w-24"
                />
                <span className="text-sm font-medium">
                  {Math.round((analysis.confidence_scores?.overall || 0) * 100)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Parsed On
              </p>
              <p className="mt-1">
                {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {analysis.system_description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                System Description
              </p>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {analysis.system_description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for detailed data */}
      <Tabs defaultValue="controls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="controls" className="gap-2">
            <Shield className="h-4 w-4" />
            Controls ({controls.length})
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Exceptions ({exceptions.length})
          </TabsTrigger>
          <TabsTrigger value="subservice" className="gap-2">
            <Network className="h-4 w-4" />
            Subservice Orgs ({subserviceOrgs.length})
          </TabsTrigger>
          <TabsTrigger value="cuecs" className="gap-2">
            <Users className="h-4 w-4" />
            CUECs ({cuecs.length})
          </TabsTrigger>
        </TabsList>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-4">
          {Object.entries(controlsByCategory).map(([category, categoryControls]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{category}</CardTitle>
                <CardDescription>
                  {categoryControls.length} controls in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-40">Test Result</TableHead>
                      <TableHead className="w-24">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryControls.map((control) => (
                      <TableRow key={control.controlId}>
                        <TableCell className="font-mono text-sm">
                          {control.controlId}
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 text-sm">
                            {control.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          {control.testResult === 'operating_effectively' && (
                            <Badge
                              variant="outline"
                              className="border-success text-success gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Effective
                            </Badge>
                          )}
                          {control.testResult === 'exception' && (
                            <Badge
                              variant="outline"
                              className="border-warning text-warning gap-1"
                            >
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
                        <TableCell>
                          <span className="text-sm">
                            {Math.round(control.confidence * 100)}%
                          </span>
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
                <p className="text-sm text-muted-foreground">
                  All tested controls are operating effectively
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exceptions.map((exception, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    'border-l-4',
                    exception.impact === 'high'
                      ? 'border-l-destructive'
                      : exception.impact === 'medium'
                        ? 'border-l-warning'
                        : 'border-l-muted-foreground'
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="font-mono">{exception.controlId}</span>
                        {exception.controlArea && (
                          <span className="text-muted-foreground font-normal">
                            - {exception.controlArea}
                          </span>
                        )}
                      </CardTitle>
                      <Badge
                        variant={
                          exception.impact === 'high'
                            ? 'destructive'
                            : exception.impact === 'medium'
                              ? 'outline'
                              : 'secondary'
                        }
                        className={
                          exception.impact === 'medium'
                            ? 'border-warning text-warning'
                            : ''
                        }
                      >
                        {exception.impact} impact
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        Exception Description
                      </p>
                      <p className="text-sm">{exception.exceptionDescription}</p>
                    </div>
                    {exception.managementResponse && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                          Management Response
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {exception.managementResponse}
                        </p>
                      </div>
                    )}
                    {exception.remediationDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Remediation:{' '}
                          {new Date(exception.remediationDate).toLocaleDateString()}
                        </span>
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
                <p className="text-sm text-muted-foreground">
                  This service organization manages all services in-house
                </p>
              </CardContent>
            </Card>
          ) : (
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
                        variant={
                          org.inclusionMethod === 'carve_out'
                            ? 'outline'
                            : 'secondary'
                        }
                        className={
                          org.inclusionMethod === 'carve_out'
                            ? 'border-warning text-warning'
                            : ''
                        }
                      >
                        {org.inclusionMethod === 'carve_out'
                          ? 'Carved Out'
                          : 'Inclusive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {org.serviceDescription}
                    </p>
                    {org.controlsSupported && org.controlsSupported.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                          Controls Supported
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {org.controlsSupported.slice(0, 5).map((c) => (
                            <Badge key={c} variant="outline" className="font-mono">
                              {c}
                            </Badge>
                          ))}
                          {org.controlsSupported.length > 5 && (
                            <Badge variant="outline">
                              +{org.controlsSupported.length - 5} more
                            </Badge>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CUECs Tab */}
        <TabsContent value="cuecs" className="space-y-4">
          {cuecs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No CUECs Identified</p>
                <p className="text-sm text-muted-foreground">
                  No complementary user entity controls were found in this report
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Complementary User Entity Controls
                </CardTitle>
                <CardDescription>
                  Controls that must be implemented by your organization
                </CardDescription>
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
                        <TableCell className="font-mono text-sm">
                          {cuec.id || `CUEC-${idx + 1}`}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{cuec.customerResponsibility}</p>
                          {cuec.description !== cuec.customerResponsibility && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {cuec.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {cuec.relatedControl && (
                            <Badge variant="outline" className="font-mono">
                              {cuec.relatedControl}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {cuec.category && (
                            <Badge variant="secondary" className="capitalize">
                              {cuec.category.replace('_', ' ')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
