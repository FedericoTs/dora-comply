/**
 * NIS2 Risk Register Page
 *
 * Unified risk management with tabbed interface:
 * - Risk Register: Detailed risk list with filtering and sorting
 * - Heat Map: Visual risk landscape with inherent/residual comparison
 */

import { Metadata } from 'next';
import { AlertTriangle, TableProperties, Grid3x3 } from 'lucide-react';
import { getRisks, getRiskSummary, getRisksForHeatMap } from '@/lib/nis2/queries';
import { RiskRegisterClient } from '@/components/nis2/risk-register';
import { RiskHeatMap, HeatMapComparison } from '@/components/nis2/heat-map';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Risk Register | NIS2 Compliance | DORA Comply',
  description: 'NIS2 ICT risk register - track, assess, and manage cybersecurity risks',
};

export default async function RiskRegisterPage() {
  // Fetch all data in parallel
  const [risksResult, summaryResult, heatMapResult] = await Promise.all([
    getRisks({}, { limit: 100 }),
    getRiskSummary(),
    getRisksForHeatMap(),
  ]);

  // Handle error state
  if (risksResult.error && risksResult.error !== 'No organization found') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Register</h1>
          <p className="text-muted-foreground mt-1">
            NIS2 ICT risk assessment and treatment tracking
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-destructive">
            Error loading risks: {risksResult.error}
          </p>
        </div>
      </div>
    );
  }

  // Handle not authenticated
  if (risksResult.error === 'No organization found') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Register</h1>
          <p className="text-muted-foreground mt-1">
            NIS2 ICT risk assessment and treatment tracking
          </p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="No organization found"
          description="Please sign in and select an organization to view your risk register."
        />
      </div>
    );
  }

  const risks = risksResult.data;
  const heatMapRisks = heatMapResult.data || [];
  const riskCount = risksResult.total;

  return (
    <div className="space-y-6">
      {/* Tabbed Content - RiskRegisterClient has its own header */}
      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <TableProperties className="h-4 w-4" />
            Risk Register
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Heat Map
          </TabsTrigger>
        </TabsList>

        {/* Risk Register Tab */}
        <TabsContent value="register">
          {risks.length > 0 ? (
            <RiskRegisterClient
              initialRisks={risks}
              summary={summaryResult.data}
              totalCount={riskCount}
            />
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No risks in your register"
              description="Start by adding your first ICT risk to track and manage."
              action={{
                label: 'Add Risk',
                href: '/nis2/risk-register/new',
              }}
            />
          )}
        </TabsContent>

        {/* Heat Map Tab */}
        <TabsContent value="heatmap">
          {heatMapRisks.length > 0 ? (
            <div className="space-y-6">
              {/* Main heat map */}
              <RiskHeatMap
                risks={heatMapRisks}
                toleranceThreshold={9}
                showLegend={true}
                showPositionMarkers={true}
              />

              {/* Comparison view */}
              <HeatMapComparison
                risks={heatMapRisks}
                toleranceThreshold={9}
              />
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No risks to visualize"
              description="Add risks to your risk register to see them on the heat map."
              action={{
                label: 'Add Risk',
                href: '/nis2/risk-register/new',
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
