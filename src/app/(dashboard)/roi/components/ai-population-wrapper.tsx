'use client';

/**
 * AI Population Wrapper
 *
 * Client component that wraps AiPopulationPanel with population handler.
 * Supports highlighting and auto-triggering population for a specific document
 * when coming from the document detail page.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AiPopulationPanel } from './ai-population-panel';
import type { PopulatableDocument } from '@/lib/roi/types';

interface AiPopulationWrapperProps {
  initialDocuments: PopulatableDocument[];
  highlightDocumentId?: string;
}

export function AiPopulationWrapper({ initialDocuments, highlightDocumentId }: AiPopulationWrapperProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const hasTriggeredRef = useRef(false);

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

  // Show guidance when navigating from document detail
  useEffect(() => {
    if (highlightDocumentId && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;

      // Find the document
      const doc = documents.find(d => d.documentId === highlightDocumentId);

      if (doc && !doc.isPopulated) {
        // Show a helpful toast guiding the user
        toast.info('Ready to Populate RoI', {
          description: `Click "Populate" on "${doc.vendorName || 'your document'}" to extract data into the Register of Information.`,
          duration: 8000,
        });

        // Scroll to the AI Population Panel after a short delay
        setTimeout(() => {
          const panel = document.querySelector('[data-ai-population-panel]');
          if (panel) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      } else if (doc?.isPopulated) {
        toast.success('Already Populated', {
          description: 'This document has already been used to populate the RoI.',
        });
      } else {
        toast.warning('Document Not Found', {
          description: 'The specified document was not found in the population queue.',
        });
      }

      // Clear the URL param to prevent re-triggering
      router.replace('/roi', { scroll: false });
    }
  }, [highlightDocumentId, documents, router]);

  return (
    <AiPopulationPanel
      documents={documents}
      onPopulateDocument={handlePopulateDocument}
      highlightDocumentId={highlightDocumentId}
    />
  );
}
