'use client';

/**
 * useRoiPopulation Hook
 *
 * Manages state and API calls for SOC2-to-RoI population.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  RoiPopulationPreview,
  ExistingMapping,
  PopulateResult,
} from '@/lib/roi/roi-population-types';

interface UseRoiPopulationProps {
  documentId: string;
}

export function useRoiPopulation({ documentId }: UseRoiPopulationProps) {
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [preview, setPreview] = useState<RoiPopulationPreview | null>(null);
  const [existingMapping, setExistingMapping] = useState<ExistingMapping | null>(null);
  const [canPopulate, setCanPopulate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVendor, setNeedsVendor] = useState(false);

  // Selection state
  const [createServices, setCreateServices] = useState(true);
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([]);
  const [populateResult, setPopulateResult] = useState<PopulateResult | null>(null);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsVendor(false);

    try {
      const response = await fetch(`/api/roi/populate-from-soc2?documentId=${documentId}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.needsVendor) {
          setNeedsVendor(true);
          setCanPopulate(false);
          return;
        }
        throw new Error(data.error || 'Failed to load preview');
      }

      setPreview(data.preview);
      setExistingMapping(data.existingMapping);
      setCanPopulate(data.canPopulate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Fetch preview on mount
  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Auto-select all subcontractors when preview loads
  useEffect(() => {
    if (preview?.subcontractors) {
      setSelectedSubcontractors(preview.subcontractors.map((s) => s.name));
    }
  }, [preview?.subcontractors]);

  const handlePopulate = useCallback(async () => {
    setPopulating(true);
    setError(null);

    try {
      const response = await fetch('/api/roi/populate-from-soc2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          options: {
            selectedSubcontractors,
            createServices,
          },
        }),
      });

      const result: PopulateResult = await response.json();

      if (!response.ok) {
        if (result.needsVendor) {
          setNeedsVendor(true);
          setCanPopulate(false);
          return;
        }
        throw new Error(result.errors?.[0] || 'Failed to populate RoI');
      }

      setPopulateResult(result);

      if (result.success) {
        toast.success('RoI populated successfully!', {
          description: `${result.vendorUpdated ? 'Vendor updated, ' : ''}${result.serviceIds?.length || 0} services, ${result.subcontractorIds?.length || 0} subcontractors created`,
        });
        fetchPreview();
      } else if (result.warnings?.length) {
        toast.warning('RoI populated with warnings', {
          description: result.warnings[0],
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to populate';
      setError(message);
      toast.error('Population failed', { description: message });
    } finally {
      setPopulating(false);
    }
  }, [documentId, selectedSubcontractors, createServices, fetchPreview]);

  const toggleSubcontractor = useCallback((name: string) => {
    setSelectedSubcontractors((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  const selectAllSubcontractors = useCallback(() => {
    if (!preview?.subcontractors) return;
    setSelectedSubcontractors(preview.subcontractors.map((s) => s.name));
  }, [preview?.subcontractors]);

  const deselectAllSubcontractors = useCallback(() => {
    setSelectedSubcontractors([]);
  }, []);

  const canSubmit = createServices || selectedSubcontractors.length > 0;

  return {
    // State
    loading,
    populating,
    preview,
    existingMapping,
    canPopulate,
    error,
    needsVendor,
    createServices,
    selectedSubcontractors,
    populateResult,
    canSubmit,

    // Actions
    setCreateServices,
    toggleSubcontractor,
    selectAllSubcontractors,
    deselectAllSubcontractors,
    handlePopulate,
    fetchPreview,
  };
}
