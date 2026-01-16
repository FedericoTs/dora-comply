import { Metadata } from 'next';
import { getRisks, getRiskSummary } from '@/lib/nis2/queries';
import { RiskRegisterClient } from '@/components/nis2/risk-register';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Risk Register | NIS2 Compliance | DORA Comply',
  description: 'NIS2 ICT risk register - track, assess, and manage cybersecurity risks',
};

export default async function RiskRegisterPage() {
  // Fetch risks and summary in parallel
  const [risksResult, summaryResult] = await Promise.all([
    getRisks({}, { limit: 100 }),
    getRiskSummary(),
  ]);

  // Handle error state
  if (risksResult.error && risksResult.error !== 'No organization found') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Register</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Risk Register</h1>
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

  return (
    <RiskRegisterClient
      initialRisks={risksResult.data}
      summary={summaryResult.data}
      totalCount={risksResult.total}
    />
  );
}
