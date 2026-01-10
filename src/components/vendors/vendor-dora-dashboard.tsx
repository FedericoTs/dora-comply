'use client';

/**
 * Vendor DORA Dashboard Component
 *
 * Displays accurate DORA compliance analysis using the full maturity calculation:
 * - All 45 DORA requirements mapped
 * - Requirements with no SOC 2 coverage flagged as L0
 * - Exception severity factored into maturity levels
 * - Expandable pillar breakdown with gap details
 *
 * Uses the centralized dora-data-service for consistent data mapping.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  FileText,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { calculateDORAFromDB, type DBParsedSOC2 } from '@/lib/compliance/dora-data-service';
import { DORAComplianceDashboard } from '@/components/compliance';
import type { DORAComplianceResult } from '@/lib/compliance/dora-types';

interface VendorDocument {
  id: string;
  filename: string;
  type: string;
  created_at: string;
  parsed_soc2?: DBParsedSOC2[];
}

interface VendorDORADashboardProps {
  vendorId: string;
  vendorName: string;
}

export function VendorDORADashboard({ vendorId, vendorName }: VendorDORADashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [doraCompliance, setDoraCompliance] = useState<DORAComplianceResult | null>(null);

  useEffect(() => {
    async function fetchDORAData() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch vendor's documents with parsed SOC 2 data
        const { data, error: fetchError } = await supabase
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
              exceptions,
              cuecs,
              subservice_orgs,
              confidence_score,
              confidence_scores,
              created_at
            )
          `)
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[VendorDORADashboard] Error fetching documents:', fetchError);
          setError('Failed to load compliance data');
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          console.log('[VendorDORADashboard] No documents found for vendor:', vendorId);
          setDocuments([]);
          setLoading(false);
          return;
        }

        // Filter to documents with parsed SOC 2 data
        const docsWithSoc2 = data.filter(
          (doc: { parsed_soc2?: unknown[] }) =>
            doc.parsed_soc2 &&
            Array.isArray(doc.parsed_soc2) &&
            doc.parsed_soc2.length > 0
        ) as VendorDocument[];

        console.log('[VendorDORADashboard] Documents with SOC2:', docsWithSoc2.length);

        setDocuments(docsWithSoc2);

        if (docsWithSoc2.length > 0) {
          // Select the most recent parsed SOC 2
          const latestDoc = docsWithSoc2[0];
          setSelectedDocId(latestDoc.id);

          // Use the centralized DORA calculator with proper field mapping
          const dbParsedData = latestDoc.parsed_soc2![0];

          console.log('[VendorDORADashboard] Calculating DORA for:', {
            vendorId,
            vendorName,
            documentId: latestDoc.id,
            controlCount: dbParsedData.controls?.length || 0,
            exceptionCount: dbParsedData.exceptions?.length || 0,
          });

          try {
            const compliance = calculateDORAFromDB(
              vendorId,
              vendorName,
              dbParsedData,
              {
                id: latestDoc.id,
                name: latestDoc.filename,
                type: latestDoc.type || 'soc2',
              }
            );
            setDoraCompliance(compliance);
          } catch (calcError) {
            console.error('[VendorDORADashboard] DORA calculation error:', calcError);
            setError(`Calculation error: ${calcError instanceof Error ? calcError.message : 'Unknown'}`);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('[VendorDORADashboard] Unexpected error:', err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }

      setLoading(false);
    }

    fetchDORAData();
  }, [vendorId, vendorName]);

  const handleDocumentChange = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc && doc.parsed_soc2?.[0]) {
      setSelectedDocId(doc.id);

      const dbParsedData = doc.parsed_soc2[0];
      const compliance = calculateDORAFromDB(
        vendorId,
        vendorName,
        dbParsedData,
        {
          id: doc.id,
          name: doc.filename,
          type: doc.type || 'soc2',
        }
      );
      setDoraCompliance(compliance);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Calculating DORA compliance...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Target className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
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
      {/* Document Selector Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-primary">DORA Compliance Analysis</p>
              <p className="text-sm text-muted-foreground mt-1">
                Maturity assessment against all 45 DORA requirements using SOC 2 evidence mapping.
                Requirements without SOC 2 coverage are flagged as gaps.
              </p>
            </div>
            {documents.length > 1 && (
              <div>
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => handleDocumentChange(e.target.value)}
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

      {/* DORA Compliance Dashboard */}
      {doraCompliance && (
        <DORAComplianceDashboard compliance={doraCompliance} />
      )}

      {/* Link to full SOC 2 analysis */}
      {selectedDocId && (
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href={`/documents/${selectedDocId}/soc2-analysis`}>
              View Full SOC 2 Analysis
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
