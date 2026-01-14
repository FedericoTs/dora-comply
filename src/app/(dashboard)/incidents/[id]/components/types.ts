/**
 * Incident Detail Page Types
 *
 * Shared types for incident detail components
 */

import type { getIncidentById, getIncidentReports, getIncidentEvents } from '@/lib/incidents/queries';

export type IncidentData = NonNullable<Awaited<ReturnType<typeof getIncidentById>>['data']>;
export type ReportData = Awaited<ReturnType<typeof getIncidentReports>>['data'];
export type EventData = Awaited<ReturnType<typeof getIncidentEvents>>['data'];

export interface NextReportInfo {
  type: string;
  deadline: Date;
}
