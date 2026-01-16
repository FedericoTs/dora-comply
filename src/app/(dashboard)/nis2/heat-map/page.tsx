import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getRisksForHeatMap } from '@/lib/nis2/queries';
import { RiskHeatMap, HeatMapComparison } from '@/components/nis2/heat-map';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Risk Heat Map | NIS2 Compliance | DORA Comply',
  description: 'Interactive NIS2 risk heat map with inherent and residual risk visualization',
};

export default async function HeatMapPage() {
  const result = await getRisksForHeatMap();

  if (result.error === 'No organization found') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/nis2/risk-register">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Risk Register
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Heat Map</h1>
          <p className="text-muted-foreground mt-1">
            Visualize your risk landscape
          </p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="No organization found"
          description="Please sign in and select an organization to view your risk heat map."
        />
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/nis2/risk-register">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Risk Register
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Heat Map</h1>
          <p className="text-muted-foreground mt-1">
            Visualize your risk landscape
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-destructive">
            Error loading risks: {result.error}
          </p>
        </div>
      </div>
    );
  }

  const risks = result.data;
  const hasRisks = risks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/nis2/risk-register">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Risk Heat Map</h1>
            <p className="text-muted-foreground mt-1">
              Visualize your NIS2 ICT risk landscape
            </p>
          </div>
        </div>
      </div>

      {hasRisks ? (
        <>
          {/* Main heat map */}
          <RiskHeatMap
            risks={risks}
            toleranceThreshold={9}
            showLegend={true}
            showPositionMarkers={true}
          />

          {/* Comparison view */}
          <HeatMapComparison
            risks={risks}
            toleranceThreshold={9}
          />
        </>
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title="No risks in your register"
          description="Add risks to your risk register to visualize them on the heat map."
          action={{
            label: 'Add Risk',
            href: '/nis2/risk-register/new',
          }}
        />
      )}
    </div>
  );
}
