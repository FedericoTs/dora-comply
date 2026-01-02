/**
 * New Incident Page
 *
 * Multi-step wizard for creating a new incident
 */

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IncidentWizard } from '@/components/incidents/incident-wizard';
import {
  getServicesForIncident,
  getCriticalFunctionsForIncident,
  getVendorsForIncident,
} from '@/lib/incidents/queries';

export const metadata = {
  title: 'Report New Incident | DORA Comply',
  description: 'Report a new ICT-related incident',
};

export default async function NewIncidentPage() {
  // Fetch reference data in parallel
  const [servicesResult, criticalFunctionsResult, vendorsResult] = await Promise.all([
    getServicesForIncident(),
    getCriticalFunctionsForIncident(),
    getVendorsForIncident(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/incidents">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Report New Incident</h1>
          <p className="text-muted-foreground">
            Complete the wizard to report an ICT-related incident
          </p>
        </div>
      </div>

      {/* Wizard */}
      <IncidentWizard
        services={servicesResult.data}
        criticalFunctions={criticalFunctionsResult.data}
        vendors={vendorsResult.data}
      />
    </div>
  );
}
