'use client';

/**
 * Vendor Frameworks Tab Component
 *
 * Main orchestrator for multi-framework compliance view.
 * Displays compliance analysis across DORA, NIS2, GDPR, and ISO 27001.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Layers, FileText, Loader2, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import {
  FrameworkCode,
  FrameworkComplianceResult,
  ComplianceStatus,
  RequirementAssessment,
} from '@/lib/compliance/framework-types';
import {
  calculateFrameworkCompliance,
  getFrameworkRequirements,
} from '@/lib/compliance/framework-calculator';

import { FrameworkSelector } from './framework-selector';
import { FrameworkComplianceCard } from './framework-compliance-card';
import { FrameworkCategoryBreakdown } from './framework-category-breakdown';
import { FrameworkGapsList } from './framework-gaps-list';
import { FrameworkComparisonChart } from './framework-comparison-chart';

interface VendorFrameworksTabProps {
  vendorId: string;
  vendorName: string;
}

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
  controls: ParsedControl[];
}

// Map SOC 2 TSC categories to framework requirements
const TSC_TO_FRAMEWORK_MAPPING: Record<FrameworkCode, Record<string, string[]>> = {
  dora: {
    CC1: ['dora-art-5', 'dora-art-6', 'dora-art-7'],
    CC2: ['dora-art-7', 'dora-art-8'],
    CC3: ['dora-art-5', 'dora-art-6', 'dora-art-9'],
    CC4: ['dora-art-9', 'dora-art-10'],
    CC5: ['dora-art-8', 'dora-art-9'],
    CC6: ['dora-art-8', 'dora-art-30'],
    CC7: ['dora-art-10', 'dora-art-17', 'dora-art-19', 'dora-art-24'],
    CC8: ['dora-art-8', 'dora-art-12'],
    CC9: ['dora-art-5', 'dora-art-28', 'dora-art-29'],
    A: ['dora-art-24', 'dora-art-30'],
    C: ['dora-art-28', 'dora-art-30'],
  },
  nis2: {
    CC1: ['nis2-art-21-governance'],
    CC3: ['nis2-art-21-risk-assessment'],
    CC5: ['nis2-art-21-access-control'],
    CC6: ['nis2-art-21-cryptography', 'nis2-art-21-access-control'],
    CC7: ['nis2-art-23-incident-handling', 'nis2-art-23-notification'],
    CC8: ['nis2-art-21-secure-development'],
    CC9: ['nis2-art-21-supply-chain'],
    A: ['nis2-art-21-business-continuity'],
  },
  gdpr: {
    CC5: ['gdpr-art-32-access-control'],
    CC6: ['gdpr-art-32-encryption', 'gdpr-art-32-pseudonymization'],
    CC7: ['gdpr-art-33-breach-notification'],
    CC8: ['gdpr-art-32-integrity'],
    A: ['gdpr-art-32-availability', 'gdpr-art-32-resilience'],
  },
  iso27001: {
    CC1: ['iso27001-a5-policies'],
    CC2: ['iso27001-a6-organization'],
    CC3: ['iso27001-a5-policies', 'iso27001-a8-asset-management'],
    CC5: ['iso27001-a9-access-control'],
    CC6: ['iso27001-a10-cryptography', 'iso27001-a9-access-control'],
    CC7: ['iso27001-a16-incident-management'],
    CC8: ['iso27001-a14-secure-development'],
    CC9: ['iso27001-a15-supplier-relationships'],
    A: ['iso27001-a17-business-continuity'],
  },
};

export function VendorFrameworksTab({ vendorId, vendorName }: VendorFrameworksTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<FrameworkCode>('dora');
  const [complianceResults, setComplianceResults] = useState<
    Record<FrameworkCode, FrameworkComplianceResult>
  >({} as Record<FrameworkCode, FrameworkComplianceResult>);

  // Generate assessments from SOC 2 controls
  const generateAssessmentsFromSOC2 = useCallback(
    (controls: ParsedControl[], framework: FrameworkCode): RequirementAssessment[] => {
      const requirements = getFrameworkRequirements(framework);
      const assessments: RequirementAssessment[] = [];

      // Count controls per TSC category
      const categoryStats: Record<string, { total: number; effective: number }> = {};
      for (const control of controls) {
        const cat = control.tscCategory?.replace(/\d+$/, '').toUpperCase() || 'OTHER';
        if (!categoryStats[cat]) categoryStats[cat] = { total: 0, effective: 0 };
        categoryStats[cat].total++;
        if (control.testResult === 'operating_effectively') {
          categoryStats[cat].effective++;
        }
      }

      // Map to framework requirements
      const mapping = TSC_TO_FRAMEWORK_MAPPING[framework];
      const requirementScores: Record<string, number> = {};

      for (const [tscCat, reqIds] of Object.entries(mapping)) {
        const stats = categoryStats[tscCat];
        if (stats && stats.total > 0) {
          const score = Math.round((stats.effective / stats.total) * 100);
          for (const reqId of reqIds) {
            if (!requirementScores[reqId] || requirementScores[reqId] < score) {
              requirementScores[reqId] = score;
            }
          }
        }
      }

      // Create assessments for each requirement
      for (const req of requirements) {
        const score = requirementScores[req.id] ?? 0;
        let status: ComplianceStatus = 'not_assessed';
        if (score >= 80) status = 'compliant';
        else if (score >= 40) status = 'partially_compliant';
        else if (score > 0) status = 'non_compliant';

        assessments.push({
          requirement_id: req.id,
          framework,
          status,
          score,
          evidence_ids: [],
          gaps: score < 80 ? [`Coverage at ${score}% - needs improvement`] : [],
          remediation_actions: [],
          assessed_at: new Date(),
          notes: '',
        });
      }

      return assessments;
    },
    []
  );

  // Calculate compliance for all frameworks
  const calculateAllFrameworks = useCallback(
    (controls: ParsedControl[]) => {
      const frameworks: FrameworkCode[] = ['dora', 'nis2', 'gdpr', 'iso27001'];
      const results: Record<FrameworkCode, FrameworkComplianceResult> = {} as Record<
        FrameworkCode,
        FrameworkComplianceResult
      >;

      for (const framework of frameworks) {
        const assessments = generateAssessmentsFromSOC2(controls, framework);
        const result = calculateFrameworkCompliance({
          vendorId,
          framework,
          assessments,
        });
        results[framework] = result;
      }

      return results;
    },
    [vendorId, generateAssessmentsFromSOC2]
  );

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch vendor's documents with parsed SOC 2 data
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select(
            `
            id,
            filename,
            type,
            parsed_soc2 (
              id,
              document_id,
              controls
            )
          `
          )
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Filter to documents with parsed SOC 2 data
        const docsWithSoc2 = (data || []).filter(
          (doc: { parsed_soc2?: unknown[] }) => doc.parsed_soc2 && doc.parsed_soc2.length > 0
        );

        if (docsWithSoc2.length === 0) {
          setHasData(false);
          setLoading(false);
          return;
        }

        setHasData(true);

        // Get the most recent parsed SOC 2
        const latestDoc = docsWithSoc2[0] as { parsed_soc2: ParsedSOC2[] };
        const soc2Data = latestDoc.parsed_soc2[0];
        const controls = soc2Data.controls || [];

        // Calculate compliance for all frameworks
        const results = calculateAllFrameworks(controls);
        setComplianceResults(results);
      } catch (err) {
        console.error('Error fetching framework data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [vendorId, calculateAllFrameworks]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing multi-framework compliance...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Compliance Data</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload and parse a SOC 2 report to generate multi-framework compliance analysis for{' '}
            {vendorName}.
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

  const selectedResult = complianceResults[selectedFramework];

  // Get compliance scores and statuses for selector
  const complianceScores: Record<FrameworkCode, number> = {
    dora: complianceResults.dora?.overall_score ?? 0,
    nis2: complianceResults.nis2?.overall_score ?? 0,
    gdpr: complianceResults.gdpr?.overall_score ?? 0,
    iso27001: complianceResults.iso27001?.overall_score ?? 0,
  };

  const complianceStatuses: Record<FrameworkCode, ComplianceStatus> = {
    dora: complianceResults.dora?.status ?? 'not_assessed',
    nis2: complianceResults.nis2?.status ?? 'not_assessed',
    gdpr: complianceResults.gdpr?.status ?? 'not_assessed',
    iso27001: complianceResults.iso27001?.status ?? 'not_assessed',
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <span className="font-medium text-primary">Multi-Framework Compliance Analysis</span>
          <span className="text-muted-foreground ml-1">
            — Coverage calculated by mapping SOC 2 Trust Services Criteria to DORA, NIS2, GDPR
            Article 32, and ISO 27001:2022 requirements.
          </span>
        </AlertDescription>
      </Alert>

      {/* Framework Selector */}
      <FrameworkSelector
        selectedFramework={selectedFramework}
        complianceScores={complianceScores}
        complianceStatuses={complianceStatuses}
        onSelect={setSelectedFramework}
      />

      {/* Selected Framework Detail */}
      {selectedResult && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <FrameworkComplianceCard framework={selectedFramework} result={selectedResult} />
            <FrameworkCategoryBreakdown
              framework={selectedFramework}
              categoryScores={selectedResult.category_scores}
            />
          </div>

          {/* Critical Gaps */}
          {selectedResult.critical_gaps.length > 0 && (
            <FrameworkGapsList
              gaps={selectedResult.critical_gaps}
              maxVisible={5}
              showCrossFrameworkImpact={true}
            />
          )}
        </>
      )}

      {/* Framework Comparison Chart */}
      {Object.keys(complianceResults).length > 0 && (
        <FrameworkComparisonChart results={complianceResults} />
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/documents?vendorId=${vendorId}`}>
                <FileText className="mr-2 h-4 w-4" />
                Upload New Report
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/frameworks">
                <ExternalLink className="mr-2 h-4 w-4" />
                View All Frameworks
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
