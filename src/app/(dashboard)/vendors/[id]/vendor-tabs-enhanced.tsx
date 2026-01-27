'use client';

/**
 * Simplified Vendor Tabs Component
 *
 * 6 core tabs for MVP: Overview, Compliance, Contacts, Contracts, Documents, Monitoring
 */

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useState, type ReactNode } from 'react';
import {
  VendorNavigationBar,
  VendorActivityTimeline,
  type VendorNavSection,
} from '@/components/vendors/detail';
import { VendorNIS2Dashboard } from '@/components/vendors/vendor-nis2-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { VendorWithRelations } from '@/lib/vendors/types';

interface VendorTabsEnhancedProps {
  vendor: VendorWithRelations;
  // Overview content
  summaryContent: ReactNode;
  // Compliance content (sub-tabs)
  doraContent: ReactNode;
  frameworksContent: ReactNode;
  riskAssessmentContent: ReactNode;
  // Core tabs
  contactsContent: ReactNode;
  contractsContent: ReactNode;
  documentsContent: ReactNode;
  intelligenceContent: ReactNode;
  // Legacy props (kept for compatibility, not displayed)
  enrichmentContent?: ReactNode;
  ctppContent?: ReactNode;
  showCTTPTab?: boolean;
}

// Map URL tab values to VendorNavSection
const tabToSection: Record<string, VendorNavSection> = {
  'overview': 'overview',
  'summary': 'overview', // Legacy support
  'compliance': 'compliance',
  'dora': 'compliance',
  'nis2': 'compliance',
  'frameworks': 'compliance',
  'risk-assessment': 'compliance',
  'contacts': 'contacts',
  'contracts': 'contracts',
  'documents': 'documents',
  'intelligence': 'intelligence',
  'monitoring': 'intelligence', // Legacy redirect
};

// Map VendorNavSection to URL tab values
const sectionToTab: Record<VendorNavSection, string> = {
  'overview': 'overview',
  'compliance': 'compliance',
  'contacts': 'contacts',
  'contracts': 'contracts',
  'documents': 'documents',
  'intelligence': 'intelligence',
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
  intelligenceContent,
}: VendorTabsEnhancedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [complianceSubTab, setComplianceSubTab] = useState('overview');

  // Get current section from URL, default to 'overview'
  const urlTab = searchParams.get('tab') || 'overview';
  const currentSection: VendorNavSection = tabToSection[urlTab] || 'overview';

  // Handle section change
  const handleSectionChange = useCallback((newSection: VendorNavSection) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', sectionToTab[newSection]);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Render content based on current section
  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {summaryContent}
            <VendorActivityTimeline vendorId={vendor.id} />
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-4">
            <Tabs value={complianceSubTab} onValueChange={setComplianceSubTab}>
              <TabsList className="grid w-full grid-cols-4 max-w-xl">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="nis2">NIS2</TabsTrigger>
                <TabsTrigger value="dora">DORA</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                {frameworksContent}
              </TabsContent>
              <TabsContent value="nis2" className="mt-4">
                <VendorNIS2Dashboard vendorId={vendor.id} vendorName={vendor.name} />
              </TabsContent>
              <TabsContent value="dora" className="mt-4">
                {doraContent}
              </TabsContent>
              <TabsContent value="risk" className="mt-4">
                {riskAssessmentContent}
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'contacts':
        return contactsContent;

      case 'contracts':
        return contractsContent;

      case 'documents':
        return documentsContent;

      case 'intelligence':
        return intelligenceContent;

      default:
        return summaryContent;
    }
  };

  return (
    <div className="space-y-6">
      <VendorNavigationBar
        activeSection={currentSection}
        onSectionChange={handleSectionChange}
      />
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}
