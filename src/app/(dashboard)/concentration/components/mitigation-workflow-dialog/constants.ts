import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Info,
  MapPin,
  Layers,
  Link2,
  Users,
} from 'lucide-react';
import type { RiskLevel } from '@/lib/concentration/types';
import type { AlertWorkflow } from './types';

export const ALERT_CONFIG: Record<RiskLevel, {
  icon: React.ElementType;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  titleClass: string;
}> = {
  critical: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/5 dark:bg-red-500/10',
    borderClass: 'border-red-500/30',
    iconClass: 'text-red-500',
    titleClass: 'text-red-700 dark:text-red-400',
  },
  high: {
    icon: AlertTriangle,
    bgClass: 'bg-orange-500/5 dark:bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    iconClass: 'text-orange-500',
    titleClass: 'text-orange-700 dark:text-orange-400',
  },
  medium: {
    icon: Info,
    bgClass: 'bg-yellow-500/5 dark:bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    iconClass: 'text-yellow-600 dark:text-yellow-500',
    titleClass: 'text-yellow-700 dark:text-yellow-400',
  },
  low: {
    icon: Bell,
    bgClass: 'bg-blue-500/5 dark:bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    iconClass: 'text-blue-500',
    titleClass: 'text-blue-700 dark:text-blue-400',
  },
};

export const ALERT_WORKFLOWS: Record<string, AlertWorkflow> = {
  spof_detected: {
    title: 'Single Point of Failure Remediation',
    description: 'Critical functions depend on a single vendor. Follow these steps to mitigate the risk.',
    icon: AlertCircle,
    actions: [
      {
        label: 'Review affected vendor details',
        description: 'Understand the vendor\'s criticality, services provided, and current contract terms.',
        link: '/vendors/{vendorId}',
        linkLabel: 'Open Vendor',
      },
      {
        label: 'Conduct substitutability assessment',
        description: 'Evaluate if the vendor can be replaced and identify potential alternatives.',
        link: '/vendors/{vendorId}?tab=risk',
        linkLabel: 'Assess Substitutability',
      },
      {
        label: 'Identify alternative vendors',
        description: 'Research and document at least 2 potential replacement vendors for the affected function.',
        link: '/vendors/new',
        linkLabel: 'Add Alternative Vendor',
      },
      {
        label: 'Review exit strategy provisions',
        description: 'Check existing contract for exit clauses, notice periods, and data portability terms.',
        link: '/vendors/{vendorId}?tab=contracts',
        linkLabel: 'View Contracts',
      },
      {
        label: 'Document recovery procedures',
        description: 'Create or update the business continuity plan for this critical function.',
        link: '/vendors/{vendorId}?tab=documents',
        linkLabel: 'Upload Documentation',
      },
    ],
  },
  geographic_concentration: {
    title: 'Geographic Concentration Remediation',
    description: 'Too many vendors are concentrated in a single region. Diversify to reduce regional risk.',
    icon: MapPin,
    actions: [
      {
        label: 'Review current geographic distribution',
        description: 'Analyze the concentration heat map to understand which regions are over-represented.',
        link: '/concentration',
        linkLabel: 'View Heat Map',
      },
      {
        label: 'Identify vendors in concentrated regions',
        description: 'List all vendors headquartered in the over-concentrated region.',
        link: '/vendors?sort=country',
        linkLabel: 'Filter Vendors',
      },
      {
        label: 'Evaluate vendors in alternative regions',
        description: 'Research vendors in under-represented regions that could provide similar services.',
        link: '/vendors/new',
        linkLabel: 'Add New Vendor',
      },
      {
        label: 'Assess data residency requirements',
        description: 'Review DORA and GDPR data residency requirements that may affect vendor selection.',
      },
      {
        label: 'Update business continuity plan',
        description: 'Document regional failover procedures in case of geographic disruption.',
        link: '/documents',
        linkLabel: 'Upload BCP Document',
      },
    ],
  },
  service_concentration: {
    title: 'Service Concentration Remediation',
    description: 'A single service type dominates your vendor portfolio. Diversify to reduce service-specific risk.',
    icon: Layers,
    actions: [
      {
        label: 'Review service distribution metrics',
        description: 'Analyze the HHI (Herfindahl-Hirschman Index) to understand concentration levels.',
        link: '/concentration',
        linkLabel: 'View Metrics',
      },
      {
        label: 'Identify dominant service providers',
        description: 'List vendors providing the over-concentrated service type.',
        link: '/vendors',
        linkLabel: 'View Vendors',
      },
      {
        label: 'Evaluate service alternatives',
        description: 'Research whether the dominant service could be split across multiple providers.',
      },
      {
        label: 'Review SLAs for concentrated services',
        description: 'Ensure robust SLAs are in place for the concentrated service type.',
        link: '/vendors?tab=contracts',
        linkLabel: 'Review Contracts',
      },
      {
        label: 'Document vendor lock-in mitigation',
        description: 'Create exit strategies for each vendor in the concentrated service area.',
      },
    ],
  },
  threshold_breach: {
    title: 'Fourth-Party Risk Remediation',
    description: 'Subcontractor chains exceed acceptable depth. Improve visibility and oversight.',
    icon: Link2,
    actions: [
      {
        label: 'Identify deep chain vendors',
        description: 'Review which vendors have the deepest subcontractor chains.',
        link: '/concentration',
        linkLabel: 'View Supply Chain',
      },
      {
        label: 'Request subcontractor information',
        description: 'Send requests to affected vendors for complete subcontractor disclosure (DORA requirement).',
        link: '/vendors',
        linkLabel: 'Contact Vendors',
      },
      {
        label: 'Assess critical function exposure',
        description: 'Determine which critical functions are exposed through deep chains.',
      },
      {
        label: 'Update vendor contracts',
        description: 'Add subcontractor notification and approval clauses to vendor contracts.',
        link: '/vendors?tab=contracts',
        linkLabel: 'Review Contracts',
      },
      {
        label: 'Implement ongoing monitoring',
        description: 'Set up periodic reviews of subcontractor chains for affected vendors.',
        link: '/settings/integrations',
        linkLabel: 'Configure Monitoring',
      },
    ],
  },
  substitutability_gap: {
    title: 'Substitutability Assessment Remediation',
    description: 'Critical vendors lack substitutability assessments. Complete assessments to ensure exit readiness.',
    icon: Users,
    actions: [
      {
        label: 'List vendors without assessments',
        description: 'Identify all critical and important vendors missing substitutability assessments.',
        link: '/vendors?filter=no-substitutability',
        linkLabel: 'View Unassessed Vendors',
      },
      {
        label: 'Prioritize by criticality',
        description: 'Start with critical tier vendors, then move to important tier.',
      },
      {
        label: 'Complete substitutability assessments',
        description: 'For each vendor, evaluate market alternatives, switching costs, and transition timeline.',
        link: '/vendors/{vendorId}?tab=risk',
        linkLabel: 'Start Assessment',
      },
      {
        label: 'Document alternative providers',
        description: 'For each assessed vendor, document at least 2 viable alternatives.',
      },
      {
        label: 'Update exit strategies',
        description: 'Based on assessments, update or create exit strategies for critical vendors.',
        link: '/documents',
        linkLabel: 'Upload Exit Strategy',
      },
    ],
  },
};

export const STORAGE_KEY = 'concentration-alert-actions';
