/**
 * Incident Form Constants
 *
 * Select options for incident forms.
 */

import type { IncidentType, ImpactLevel } from './types';

// Re-export centralized date utility for backwards compatibility
export { formatDateTimeLocal } from '@/lib/date-utils';

export const INCIDENT_TYPE_OPTIONS: Array<{ value: IncidentType; label: string }> = [
  { value: 'cyber_attack', label: 'Cyber Attack' },
  { value: 'system_failure', label: 'System Failure' },
  { value: 'human_error', label: 'Human Error' },
  { value: 'third_party_failure', label: 'Third-Party Failure' },
  { value: 'natural_disaster', label: 'Natural Disaster' },
  { value: 'other', label: 'Other' },
];

export const IMPACT_LEVEL_OPTIONS: Array<{ value: ImpactLevel; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
