'use client';

/**
 * @deprecated Use VendorDORADashboard from '@/components/vendors/vendor-dora-dashboard' instead.
 *
 * This component uses a simplified calculation that ONLY counts SOC 2 control effectiveness
 * and maps it to DORA pillars. It IGNORES DORA requirements that have no SOC 2 mapping
 * (e.g., Art. 18, 19, 26, 31, 45), leading to misleading 100% scores.
 *
 * The new VendorDORADashboard component uses the correct calculateDORACompliance function
 * that evaluates all 45 DORA requirements, accounts for evidence gaps, and provides
 * accurate maturity-based scoring (L0-L4).
 *
 * OLD Vendor DORA Compliance Component (DEPRECATED)
 *
 * Displays DORA compliance analysis for a vendor based on:
 * - Parsed SOC 2 reports
 * - Gap analysis with remediation guidance
 * - Article-level mapping and coverage
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  ExternalLink,
  ChevronRight,
  ScrollText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DORACoverageChart, type DORAcoverageByPillar } from '@/components/compliance';
import { DORAGapAnalysis, DORA_ARTICLES, type GapAnalysisItem } from '@/components/compliance';
import { createClient } from '@/lib/supabase/client';

interface ParsedControl {
  controlId: string;
  controlArea: string;
  tscCategory: string;
  description: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  confidence: number;
}

interface ParsedSOC2 {
  id: string;
  document_id: string;
  report_type: 'type1' | 'type2';
  audit_firm: string;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  period_start: string;
  period_end: string;
  controls: ParsedControl[];
  created_at: string;
}

interface VendorDocument {
  id: string;
  filename: string;
  type: string;
  created_at: string;
  parsed_soc2?: ParsedSOC2[];
}

interface VendorDORAComplianceProps {
  vendorId: string;
  vendorName: string;
}

export function VendorDORACompliance({ vendorId, vendorName }: VendorDORAComplianceProps) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [doraCoverage, setDoraCoverage] = useState<{
    overall: number;
    byPillar: DORAcoverageByPillar;
    gaps: string[];
  } | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisItem[]>([]);
  const [controlStats, setControlStats] = useState({
    total: 0,
    effective: 0,
    exceptions: 0,
    notTested: 0,
  });

  useEffect(() => {
    async function fetchDORAData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch vendor's documents with parsed SOC 2 data
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          filename,
          type,
          created_at,
          parsed_soc2 (
            id,
            document_id,
            report_type,
            audit_firm,
            opinion,
            period_start,
            period_end,
            controls,
            created_at
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching documents:', error);
        setLoading(false);
        return;
      }

      // Filter to documents with parsed SOC 2 data
      const docsWithSoc2 = data.filter(
        (doc: { parsed_soc2?: unknown[] }) => doc.parsed_soc2 && doc.parsed_soc2.length > 0
      ) as VendorDocument[];

      setDocuments(docsWithSoc2);

      if (docsWithSoc2.length > 0) {
        // Select the most recent parsed SOC 2
        const latestDoc = docsWithSoc2[0];
        setSelectedDocId(latestDoc.id);
        processSOC2Data(latestDoc.parsed_soc2![0]);
      }

      setLoading(false);
    }

    fetchDORAData();
  }, [vendorId]);

  const processSOC2Data = (soc2Data: ParsedSOC2) => {
    const controls = soc2Data.controls || [];

    // Calculate control stats
    const stats = {
      total: controls.length,
      effective: controls.filter((c) => c.testResult === 'operating_effectively').length,
      exceptions: controls.filter((c) => c.testResult === 'exception').length,
      notTested: controls.filter((c) => c.testResult === 'not_tested').length,
    };
    setControlStats(stats);

    // Calculate DORA coverage by pillar
    const coverage = calculateDORACoverage(controls);
    setDoraCoverage(coverage);

    // Generate gap analysis
    const gaps = generateGapAnalysis(controls);
    setGapAnalysis(gaps);
  };

  const calculateDORACoverage = (
    controls: ParsedControl[]
  ): { overall: number; byPillar: DORAcoverageByPillar; gaps: string[] } => {
    const coverageByPillar: DORAcoverageByPillar = {
      ICT_RISK: 0,
      INCIDENT: 0,
      TESTING: 0,
      TPRM: 0,
      SHARING: 0,
    };

    // Count controls per TSC category
    const categoryCount: Record<string, { total: number; effective: number }> = {};
    for (const control of controls) {
      const cat = control.tscCategory?.replace(/\d+$/, '').toUpperCase() || 'OTHER';
      if (!categoryCount[cat]) categoryCount[cat] = { total: 0, effective: 0 };
      categoryCount[cat].total++;
      if (control.testResult === 'operating_effectively') {
        categoryCount[cat].effective++;
      }
    }

    // Map to DORA pillars
    const pillarMapping: Record<string, string[]> = {
      ICT_RISK: ['CC1', 'CC3', 'CC4', 'CC5', 'CC6', 'CC7', 'CC8'],
      INCIDENT: ['CC7'],
      TESTING: ['A', 'CC7', 'CC9'],
      TPRM: ['CC9', 'C'],
      SHARING: [],
    };

    for (const [pillar, categories] of Object.entries(pillarMapping)) {
      if (categories.length === 0) {
        coverageByPillar[pillar as keyof DORAcoverageByPillar] = 0;
        continue;
      }
      let pillarScore = 0;
      let catCount = 0;
      for (const cat of categories) {
        if (categoryCount[cat]) {
          const catScore =
            categoryCount[cat].total > 0
              ? (categoryCount[cat].effective / categoryCount[cat].total) * 100
              : 0;
          pillarScore += catScore;
          catCount++;
        }
      }
      coverageByPillar[pillar as keyof DORAcoverageByPillar] =
        catCount > 0 ? Math.round(pillarScore / catCount) : 0;
    }

    const overall = Object.values(coverageByPillar).reduce((a, b) => a + b, 0) / 5;
    const gaps = Object.entries(coverageByPillar)
      .filter(([_, score]) => score < 50)
      .map(([pillar]) => pillar);

    return { overall: Math.round(overall), byPillar: coverageByPillar, gaps };
  };

  const generateGapAnalysis = (controls: ParsedControl[]): GapAnalysisItem[] => {
    const gapItems: GapAnalysisItem[] = [];

    // Map controls to DORA articles
    const articleMapping: Record<string, string[]> = {
      'Art.5': ['CC1', 'CC3', 'CC9'],
      'Art.6': ['CC3'],
      'Art.7': ['CC1', 'CC2'],
      'Art.8': ['CC5', 'CC6', 'CC8'],
      'Art.9': ['CC4'],
      'Art.10': ['CC7'],
      'Art.17': ['CC7'],
      'Art.19': ['CC7'],
      'Art.24': ['A', 'CC7'],
      'Art.28': ['CC9', 'C'],
      'Art.29': ['CC9'],
      'Art.30': ['CC6', 'A', 'C'],
      'Art.45': [],
    };

    for (const [article, categories] of Object.entries(articleMapping)) {
      if (!(article in DORA_ARTICLES)) continue;

      const matchingControls = controls.filter((c) =>
        categories.some((cat) => c.tscCategory?.toUpperCase().startsWith(cat))
      );

      const effectiveCount = matchingControls.filter(
        (c) => c.testResult === 'operating_effectively'
      ).length;

      const coverage =
        matchingControls.length > 0
          ? Math.round((effectiveCount / matchingControls.length) * 100)
          : 0;

      let status: 'covered' | 'partial' | 'gap' = 'gap';
      if (coverage >= 80) status = 'covered';
      else if (coverage >= 40) status = 'partial';

      gapItems.push({
        article: article as keyof typeof DORA_ARTICLES,
        coverageStatus: status,
        coverageScore: coverage,
        evidence: matchingControls.map((c) => ({
          controlId: c.controlId,
          controlName: c.controlArea || c.tscCategory,
          testResult: c.testResult,
          mappingStrength: coverage >= 80 ? 'full' : coverage >= 40 ? 'partial' : 'none',
        })),
      });
    }

    return gapItems;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading DORA compliance data...</p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No DORA Compliance Data</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload and parse a SOC 2 report to generate DORA compliance mapping for {vendorName}.
          </p>
          <Button asChild>
            <Link href={`/documents?vendorId=${vendorId}`}>
              <FileText className="mr-2 h-4 w-4" />
              Upload SOC 2 Report
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-primary">DORA Compliance Mapping</p>
              <p className="text-sm text-muted-foreground mt-1">
                Analysis based on SOC 2 reports. Coverage is calculated by mapping Trust Services
                Criteria controls to DORA articles.
              </p>
            </div>
            {documents.length > 1 && (
              <div>
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => {
                    const doc = documents.find((d) => d.id === e.target.value);
                    if (doc && doc.parsed_soc2?.[0]) {
                      setSelectedDocId(doc.id);
                      processSOC2Data(doc.parsed_soc2[0]);
                    }
                  }}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coverage Overview */}
      {doraCoverage && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* DORA Coverage Chart */}
          <DORACoverageChart
            coverage={doraCoverage.byPillar}
            overallScore={doraCoverage.overall}
            gaps={doraCoverage.gaps}
            size="md"
            showLegend={false}
          />

          {/* Control Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SOC 2 Control Statistics
              </CardTitle>
              <CardDescription>Control test results from the latest SOC 2 report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress bars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm">Operating Effectively</span>
                  </div>
                  <span className="font-medium text-success">{controlStats.effective}</span>
                </div>
                <Progress
                  value={(controlStats.effective / controlStats.total) * 100}
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm">With Exceptions</span>
                  </div>
                  <span
                    className={cn(
                      'font-medium',
                      controlStats.exceptions > 0 ? 'text-warning' : 'text-muted-foreground'
                    )}
                  >
                    {controlStats.exceptions}
                  </span>
                </div>
                <Progress
                  value={(controlStats.exceptions / controlStats.total) * 100}
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Not Tested</span>
                  </div>
                  <span className="font-medium text-muted-foreground">
                    {controlStats.notTested}
                  </span>
                </div>
                <Progress
                  value={(controlStats.notTested / controlStats.total) * 100}
                  className="h-2"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Controls</span>
                <span className="text-lg font-bold">{controlStats.total}</span>
              </div>

              {/* Link to full analysis */}
              {selectedDocId && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/documents/${selectedDocId}/soc2-analysis`}>
                    View Full SOC 2 Analysis
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gap Analysis */}
      {gapAnalysis.length > 0 && <DORAGapAnalysis gaps={gapAnalysis} />}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href={`/documents?vendorId=${vendorId}`}>
                <FileText className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Upload New Report</p>
                  <p className="text-xs text-muted-foreground">Add SOC 2 or ISO 27001</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href={`/roi?vendorId=${vendorId}`}>
                <ScrollText className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Register of Information</p>
                  <p className="text-xs text-muted-foreground">DORA RoI submission</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-3" disabled>
              <Target className="mr-2 h-4 w-4" />
              <div className="text-left">
                <p className="font-medium">Export DORA Report</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

