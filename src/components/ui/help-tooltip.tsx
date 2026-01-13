'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

/**
 * Contextual help tooltip for form fields and complex UI elements.
 * Use next to form labels to provide additional context.
 *
 * @example
 * <FormLabel className="flex items-center gap-1.5">
 *   LEI Code
 *   <HelpTooltip content="Legal Entity Identifier - a 20-character unique code" />
 * </FormLabel>
 */
export function HelpTooltip({
  content,
  side = 'top',
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'text-muted-foreground hover:text-foreground transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
          aria-label="Help"
        >
          <HelpCircle className={cn('h-4 w-4', iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * DORA-specific help content for common fields
 */
export const DORA_HELP = {
  lei: 'Legal Entity Identifier (LEI) - A unique 20-character code that identifies legal entities participating in financial transactions. Required for DORA compliance.',
  tier: 'Vendor tier classification based on criticality: Critical (essential services), Important (significant impact), or Standard (routine services).',
  criticalFunction: 'A function whose disruption would materially impair the financial entity\'s ability to meet regulatory obligations or continue business.',
  providerType: 'The category of ICT services provided: Cloud (IaaS/PaaS/SaaS), Data Center, Network, Software, Security, or Other.',
  intraGroup: 'Select if this vendor is part of your corporate group or provides services through an intra-group arrangement.',
  subcontracting: 'Information about any subcontractors used by this vendor to deliver services to your organization.',
  exitStrategy: 'Your plan for transitioning away from this vendor if needed, including data portability and service continuity.',
} as const;

/**
 * KPI explanations for dashboard metrics
 */
export const KPI_HELP = {
  // Main Dashboard
  totalVendors: 'Total number of ICT third-party service providers registered in your organization\'s vendor inventory.',
  roiReadiness: 'Percentage of Register of Information (RoI) templates completed and ready for regulatory submission under DORA Article 28.',
  criticalRisks: 'Number of vendors classified as critical or high risk that require immediate attention or mitigation actions.',
  activeIncidents: 'ICT-related incidents currently open and being managed. DORA requires timely reporting of major incidents.',
  testingCoverage: 'Percentage of critical systems and vendors covered by resilience testing (TLPT) as required by DORA Chapter IV.',
  daysToDeadline: 'Days remaining until the DORA compliance deadline (January 17, 2026). Plan accordingly to meet all requirements.',

  // Incidents
  mttd: 'Mean Time to Detect - Average time from incident occurrence to detection. Lower values indicate better monitoring capabilities.',
  mttr: 'Mean Time to Resolve - Average time from detection to resolution. DORA emphasizes rapid incident response.',
  reportCompliance: 'Percentage of incident reports submitted within DORA-mandated deadlines (4h initial, 72h intermediate, 30d final).',
  majorIncidents: 'Incidents classified as "Major" per DORA Article 19 criteria, requiring notification to competent authorities.',
  significantIncidents: 'Incidents meeting significance thresholds but not classified as major. Still require internal tracking.',
  pendingReports: 'Number of incident reports due but not yet submitted. Overdue reports may result in regulatory scrutiny.',

  // RoI Dashboard
  completeness: 'Overall completion percentage across all 15 ESA Register of Information templates required for DORA submission.',
  templatesReady: 'Number of templates with 100% completeness, ready for regulatory submission.',
  totalRecords: 'Total data records (rows) across all RoI templates, representing your ICT service provider relationships.',
  fieldsCompleted: 'Estimated number of data fields populated across all templates.',
  submissionDeadline: 'Regulatory deadline for RoI submission to your National Competent Authority (NCA).',
  highPriorityActions: 'Critical gaps in mandatory fields that must be addressed before submission.',
  quickWins: 'Easy-to-complete fields that can rapidly improve your RoI completeness score.',
  aiPopulatable: 'Documents with parsed data that can automatically populate RoI fields using AI assistance.',

  // Concentration Dashboard
  hhi: 'Herfindahl-Hirschman Index - Measures market concentration. Values above 2500 indicate high concentration risk per DORA guidelines.',
  geographicSpread: 'Distribution of vendors across EU and non-EU jurisdictions. DORA requires monitoring geographic concentration.',
  substitutability: 'Percentage of vendors with identified alternatives. Critical for exit strategy planning under DORA Article 28.',
  fourthPartyDepth: 'Average number of subcontracting levels in your supply chain. Deep chains increase operational risk.',
  spof: 'Single Points of Failure - Vendors or services without alternatives that could critically impact operations if disrupted.',

  // Compliance Pillars
  ictRiskManagement: 'DORA Chapter II - Framework for identifying, classifying, and managing ICT risks across your organization.',
  incidentReporting: 'DORA Chapter III - Requirements for detecting, managing, and reporting ICT-related incidents.',
  resilienceTesting: 'DORA Chapter IV - Digital operational resilience testing including TLPT for critical functions.',
  thirdPartyRisk: 'DORA Chapter V - Management of ICT third-party service providers and supply chain risks.',
  informationSharing: 'DORA Chapter VI - Voluntary sharing of cyber threat intelligence with other financial entities.',
  maturityLevel: 'Assessment of implementation progress: L0 (Initial) to L4 (Optimized). L3 is minimum for DORA readiness.',
} as const;
