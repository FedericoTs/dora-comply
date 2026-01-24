'use client';

/**
 * Enhanced Vendor Tabs Component
 *
 * Uses the new VendorNavigationBar with grouped dropdowns
 * and integrates AI Analysis and Risk Intelligence sections.
 */

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, type ReactNode } from 'react';
import {
  VendorNavigationBar,
  VendorActivityTimeline,
  VendorRiskTimeline,
  type VendorNavSection,
} from '@/components/vendors/detail';
import { VendorAIAnalysis } from '@/components/vendors/ai';
import { VendorRiskIntelligence } from '@/components/vendors/intelligence';
import { VendorNIS2Dashboard } from '@/components/vendors/vendor-nis2-dashboard';
import type { VendorWithRelations } from '@/lib/vendors/types';

interface VendorTabsEnhancedProps {
  vendor: VendorWithRelations;
  // Summary/Overview content
  summaryContent: ReactNode;
  // Compliance content
  doraContent: ReactNode;
  frameworksContent: ReactNode;
  riskAssessmentContent: ReactNode;
  // Relationships content
  contactsContent: ReactNode;
  contractsContent: ReactNode;
  documentsContent: ReactNode;
  // Intelligence content (monitoring is passed, AI & Risk are built-in)
  monitoringContent: ReactNode;
  // Other
  enrichmentContent: ReactNode;
  ctppContent?: ReactNode;
  showCTTPTab?: boolean;
}

// Map URL tab values to VendorNavSection
const tabToSection: Record<string, VendorNavSection> = {
  'overview': 'summary',
  'summary': 'summary',
  'dora': 'dora',
  'nis2': 'nis2',
  'frameworks': 'frameworks',
  'risk-assessment': 'risk-assessment',
  'contacts': 'contacts',
  'contracts': 'contracts',
  'documents': 'documents',
  'monitoring': 'monitoring',
  'ai-analysis': 'ai-analysis',
  'risk-trends': 'risk-trends',
  'enrichment': 'enrichment',
  'ctpp-oversight': 'ctpp',
  'ctpp': 'ctpp',
};

// Map VendorNavSection to URL tab values
const sectionToTab: Record<VendorNavSection, string> = {
  'summary': 'summary',
  'dora': 'dora',
  'nis2': 'nis2',
  'frameworks': 'frameworks',
  'risk-assessment': 'risk-assessment',
  'contacts': 'contacts',
  'contracts': 'contracts',
  'documents': 'documents',
  'monitoring': 'monitoring',
  'ai-analysis': 'ai-analysis',
  'risk-trends': 'risk-trends',
  'enrichment': 'enrichment',
  'ctpp': 'ctpp-oversight',
};

export function VendorTabsEnhanced({
  vendor,
  summaryContent,
  doraContent,
  frameworksContent,
  riskAssessmentContent,
  contactsContent,
  contractsContent,
  documentsContent,
  monitoringContent,
  enrichmentContent,
  ctppContent,
  showCTTPTab = false,
}: VendorTabsEnhancedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current section from URL, default to 'summary'
  const urlTab = searchParams.get('tab') || 'summary';
  const currentSection: VendorNavSection = tabToSection[urlTab] || 'summary';

  // Handle section change
  const handleSectionChange = useCallback((newSection: VendorNavSection) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', sectionToTab[newSection]);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Render content based on current section
  const renderContent = () => {
    switch (currentSection) {
      case 'summary':
        return (
          <div className="space-y-6">
            {summaryContent}
            {/* Activity Timeline in Summary */}
            <VendorActivityTimeline vendorId={vendor.id} />
          </div>
        );

      case 'dora':
        return doraContent;

      case 'nis2':
        return <VendorNIS2Dashboard vendorId={vendor.id} vendorName={vendor.name} />;

      case 'frameworks':
        return frameworksContent;

      case 'risk-assessment':
        return riskAssessmentContent;

      case 'contacts':
        return contactsContent;

      case 'contracts':
        return contractsContent;

      case 'documents':
        return documentsContent;

      case 'monitoring':
        return monitoringContent;

      case 'ai-analysis':
        return <VendorAIAnalysis vendor={vendor} />;

      case 'risk-trends':
        return (
          <div className="space-y-6">
            <VendorRiskTimeline
              vendorId={vendor.id}
              vendorName={vendor.name}
              currentScore={vendor.external_risk_score}
              currentGrade={vendor.external_risk_grade}
            />
            <VendorRiskIntelligence vendor={vendor} />
          </div>
        );

      case 'enrichment':
        return enrichmentContent;

      case 'ctpp':
        return ctppContent || (
          <div className="p-8 text-center text-muted-foreground">
            <p>CTPP Oversight content not available.</p>
          </div>
        );

      default:
        return summaryContent;
    }
  };

  return (
    <div className="space-y-6">
      <VendorNavigationBar
        activeSection={currentSection}
        onSectionChange={handleSectionChange}
        showCTTPTab={showCTTPTab}
        hasAIAnalysis={true}
      />
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}
