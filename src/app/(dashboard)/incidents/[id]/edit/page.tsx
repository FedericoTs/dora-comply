/**
 * Incident Edit Page
 *
 * Tab-based editing interface for incident details with auto-reclassification
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getIncidentById } from '@/lib/incidents/queries';
import { getVendors } from '@/lib/vendors/queries';
import { IncidentEditForm } from '@/components/incidents/incident-edit-form';

interface IncidentEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IncidentEditPageProps) {
  const { id } = await params;
  const { data: incident } = await getIncidentById(id);
  if (!incident) {
    return { title: 'Incident Not Found | DORA Comply' };
  }
  return {
    title: `Edit ${incident.incident_ref} | DORA Comply`,
    description: `Edit incident details for ${incident.incident_ref}`,
  };
}

export default async function IncidentEditPage({ params }: IncidentEditPageProps) {
  const { id } = await params;
  const [{ data: incident, error }, { data: vendors }] = await Promise.all([
    getIncidentById(id),
    getVendors(),
  ]);

  if (error || !incident) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/incidents/${id}`}>
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to incident</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {incident.incident_ref}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Edit Incident
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/incidents/${id}`}>Cancel</Link>
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <IncidentEditForm
        incident={incident}
        vendors={vendors || []}
      />
    </div>
  );
}
