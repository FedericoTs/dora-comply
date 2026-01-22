'use client';

/**
 * Framework Context Banner
 *
 * Displays the currently active framework and provides context-specific
 * information for general pages (Third Parties, Documents, Incidents).
 */

import { useFramework } from '@/lib/context/framework-context';
import { FRAMEWORK_DISPLAY_NAMES, FRAMEWORK_COLORS } from '@/lib/licensing/types';
import { cn } from '@/lib/utils';
import { Shield, Building2, FileText, AlertTriangle } from 'lucide-react';
import type { FrameworkCode } from '@/lib/licensing/types';

interface FrameworkContextBannerProps {
  /** The page type to show context-specific information */
  pageType: 'vendors' | 'documents' | 'incidents';
  /** Optional className for styling */
  className?: string;
}

// Framework-specific context messages per page
const FRAMEWORK_CONTEXT: Record<FrameworkCode, Record<string, { title: string; description: string }>> = {
  dora: {
    vendors: {
      title: 'DORA Third-Party Risk Management',
      description: 'Managing ICT third-party providers under DORA Article 28-30. Focus on critical providers, LEI validation, and contractual arrangements.',
    },
    documents: {
      title: 'DORA Evidence & Documentation',
      description: 'Documents supporting DORA compliance including SOC 2 reports, contracts with DORA clauses, and resilience testing results.',
    },
    incidents: {
      title: 'DORA ICT Incident Reporting',
      description: 'ICT-related incidents under DORA Article 19. Major incidents require reporting within 4 hours (initial), 72 hours (intermediate), and 1 month (final).',
    },
  },
  nis2: {
    vendors: {
      title: 'NIS2 Supply Chain Security',
      description: 'Managing supply chain risks under NIS2 Article 21(2)(d). Focus on security requirements for suppliers and service providers.',
    },
    documents: {
      title: 'NIS2 Compliance Evidence',
      description: 'Documents supporting NIS2 risk management measures including policies, assessments, and security certifications.',
    },
    incidents: {
      title: 'NIS2 Incident Notification',
      description: 'Security incidents under NIS2 Article 23. Significant incidents require early warning within 24 hours and initial notification within 72 hours.',
    },
  },
  gdpr: {
    vendors: {
      title: 'GDPR Data Processors',
      description: 'Managing data processors under GDPR Article 28. Focus on processing agreements and cross-border transfers.',
    },
    documents: {
      title: 'GDPR Documentation',
      description: 'Documents supporting GDPR compliance including DPAs, DPIAs, and records of processing activities.',
    },
    incidents: {
      title: 'GDPR Data Breaches',
      description: 'Personal data breaches under GDPR Article 33-34. Notify authority within 72 hours if risk to individuals.',
    },
  },
  iso27001: {
    vendors: {
      title: 'ISO 27001 Supplier Management',
      description: 'Supplier relationships under ISO 27001 Annex A.15. Focus on information security in supplier agreements.',
    },
    documents: {
      title: 'ISO 27001 Evidence',
      description: 'Documents supporting ISMS including policies, procedures, audit reports, and certificates.',
    },
    incidents: {
      title: 'ISO 27001 Security Incidents',
      description: 'Information security incidents under ISO 27001 Annex A.16. Focus on incident response and lessons learned.',
    },
  },
};

// Icons for each page type
const PAGE_ICONS = {
  vendors: Building2,
  documents: FileText,
  incidents: AlertTriangle,
};

export function FrameworkContextBanner({ pageType, className }: FrameworkContextBannerProps) {
  const { activeFramework } = useFramework();

  const context = FRAMEWORK_CONTEXT[activeFramework]?.[pageType];
  const Icon = PAGE_ICONS[pageType];
  const frameworkColor = FRAMEWORK_COLORS[activeFramework];

  if (!context) return null;

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border bg-muted/30',
      className
    )}>
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg',
        frameworkColor,
        'text-white'
      )}>
        <Shield className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            frameworkColor,
            'text-white'
          )}>
            {FRAMEWORK_DISPLAY_NAMES[activeFramework]}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="font-medium text-sm">{context.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{context.description}</p>
      </div>
    </div>
  );
}

/**
 * Compact framework indicator for use in page headers
 */
export function FrameworkIndicator({ className }: { className?: string }) {
  const { activeFramework } = useFramework();
  const frameworkColor = FRAMEWORK_COLORS[activeFramework];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(
        'w-2 h-2 rounded-full',
        frameworkColor
      )} />
      <span className="text-sm font-medium text-muted-foreground">
        {FRAMEWORK_DISPLAY_NAMES[activeFramework]} Context
      </span>
    </div>
  );
}
