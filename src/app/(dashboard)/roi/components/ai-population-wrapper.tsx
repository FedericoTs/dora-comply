'use client';

/**
 * AI Population Wrapper
 *
 * Client component that wraps AiPopulationPanel with population handler
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AiPopulationPanel } from './ai-population-panel';
import type { PopulatableDocument } from '@/lib/roi/types';

interface AiPopulationWrapperProps {
  initialDocuments: PopulatableDocument[];
}

export function AiPopulationWrapper({ initialDocuments }: AiPopulationWrapperProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);

  const handlePopulateDocument = useCallback(async (documentId: string) => {
    try {
      // First get preview to show what will be populated
      const previewResponse = await fetch(`/api/roi/populate-from-soc2?documentId=${documentId}`);

      if (!previewResponse.ok) {
        const error = await previewResponse.json();

        // Special handling for vendor not linked
        if (error.needsVendor) {
          toast.error('Vendor Required', {
            description: 'Please link this document to a vendor first.',
            action: {
              label: 'Go to Documents',
              onClick: () => router.push(`/documents/${documentId}`),
            },
          });
          return;
        }

        throw new Error(error.error || 'Failed to preview population');
      }

      const preview = await previewResponse.json();

      // If preview looks good, proceed with population
      const populateResponse = await fetch('/api/roi/populate-from-soc2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (!populateResponse.ok) {
        const error = await populateResponse.json();
        throw new Error(error.error || 'Failed to populate RoI');
      }

      const result = await populateResponse.json();

      // Update local state to mark document as populated
      setDocuments(prev =>
        prev.map(doc =>
          doc.documentId === documentId
            ? { ...doc, isPopulated: true, populatedAt: new Date() }
            : doc
        )
      );

      // Show success message with details
      const servicesCreated = result.serviceIds?.length || 0;
      const subsCreated = result.subcontractorIds?.length || 0;
      const vendorUpdated = result.vendorUpdated;

      let message = '';
      if (vendorUpdated) message += 'Vendor updated. ';
      if (servicesCreated > 0) message += `${servicesCreated} service(s) created. `;
      if (subsCreated > 0) message += `${subsCreated} subcontractor(s) added.`;

      toast.success('RoI Populated!', {
        description: message || 'Data extracted from SOC2 report',
        action: {
          label: 'View RoI',
          onClick: () => router.push('/roi'),
        },
      });

      // Refresh to update server data
      router.refresh();
    } catch (error) {
      console.error('Population error:', error);
      toast.error('Population Failed', {
        description: error instanceof Error ? error.message : 'Failed to populate RoI data',
      });
    }
  }, [router]);

  return (
    <AiPopulationPanel
      documents={documents}
      onPopulateDocument={handlePopulateDocument}
    />
  );
}
