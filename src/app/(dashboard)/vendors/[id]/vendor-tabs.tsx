'use client';

/**
 * Vendor Tabs Component
 *
 * Client component that handles tab state via URL searchParams.
 * Enables deep linking and tab persistence when navigating.
 */

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, type ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Users, ScrollText, Sparkles, Target, Radio, Layers } from 'lucide-react';

interface VendorTabsProps {
  overview: ReactNode;
  contacts: ReactNode;
  documents: ReactNode;
  contracts: ReactNode;
  enrichment: ReactNode;
  dora: ReactNode;
  monitoring: ReactNode;
  frameworks: ReactNode;
}

export function VendorTabs({
  overview,
  contacts,
  documents,
  contracts,
  enrichment,
  dora,
  monitoring,
  frameworks,
}: VendorTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current tab from URL, default to 'overview'
  const currentTab = searchParams.get('tab') || 'overview';

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="contacts">
          <Users className="h-4 w-4 mr-1.5" />
          Contacts
        </TabsTrigger>
        <TabsTrigger value="documents">
          <FileText className="h-4 w-4 mr-1.5" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="contracts">
          <ScrollText className="h-4 w-4 mr-1.5" />
          Contracts
        </TabsTrigger>
        <TabsTrigger value="enrichment">
          <Sparkles className="h-4 w-4 mr-1.5" />
          Enrichment
        </TabsTrigger>
        <TabsTrigger value="dora">
          <Target className="h-4 w-4 mr-1.5" />
          DORA
        </TabsTrigger>
        <TabsTrigger value="monitoring">
          <Radio className="h-4 w-4 mr-1.5" />
          Monitoring
        </TabsTrigger>
        <TabsTrigger value="frameworks">
          <Layers className="h-4 w-4 mr-1.5" />
          Frameworks
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {overview}
      </TabsContent>

      <TabsContent value="contacts">
        {contacts}
      </TabsContent>

      <TabsContent value="documents">
        {documents}
      </TabsContent>

      <TabsContent value="contracts">
        {contracts}
      </TabsContent>

      <TabsContent value="enrichment">
        {enrichment}
      </TabsContent>

      <TabsContent value="dora">
        {dora}
      </TabsContent>

      <TabsContent value="monitoring">
        {monitoring}
      </TabsContent>

      <TabsContent value="frameworks">
        {frameworks}
      </TabsContent>
    </Tabs>
  );
}
