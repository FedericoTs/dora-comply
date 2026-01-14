'use client';

/**
 * RoI Population Tab - 10X Market Differentiator
 *
 * One-click SOC2-to-RoI population. No competitor does this.
 *
 * PREREQUISITE: Document must be linked to an existing vendor.
 *
 * Features:
 * - Preview extracted data before population
 * - Updates existing vendor with SOC2 audit metadata
 * - Creates ICT services from system description
 * - Creates subcontractors (fourth parties) from SOC2 subservice orgs
 */

import { TooltipProvider } from '@/components/ui/tooltip';
import { useRoiPopulation } from '@/hooks/use-roi-population';
import {
  RoiPopulationLoading,
  RoiPopulationError,
  RoiNeedsVendor,
  RoiAlreadyPopulated,
  RoiUnableToPopulate,
  RoiPopulationSuccess,
} from './roi-population-states';
import { RoiPopulationHeader } from './roi-population-header';
import {
  RoiTemplatesSection,
  RoiVendorSection,
  RoiServicesSection,
  RoiSubcontractorsSection,
} from './roi-population-sections';
import { RoiPopulationSummary } from './roi-population-summary';

interface RoiPopulationTabProps {
  documentId: string;
  vendorName?: string;
  vendorId?: string;
}

export function RoiPopulationTab({ documentId }: RoiPopulationTabProps) {
  const {
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
    setCreateServices,
    toggleSubcontractor,
    selectAllSubcontractors,
    deselectAllSubcontractors,
    handlePopulate,
    fetchPreview,
  } = useRoiPopulation({ documentId });

  // Loading state
  if (loading) {
    return <RoiPopulationLoading />;
  }

  // Error state (no preview available)
  if (error && !preview) {
    return <RoiPopulationError error={error} onRetry={fetchPreview} />;
  }

  // Document not linked to vendor
  if (needsVendor) {
    return <RoiNeedsVendor documentId={documentId} />;
  }

  // Already populated
  if (existingMapping?.isConfirmed) {
    return <RoiAlreadyPopulated existingMapping={existingMapping} />;
  }

  // Cannot populate (no preview or insufficient data)
  if (!preview || !canPopulate) {
    return <RoiUnableToPopulate />;
  }

  // Successfully populated
  if (populateResult?.success) {
    return <RoiPopulationSuccess result={populateResult} />;
  }

  // Main preview and selection UI
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with value proposition */}
        <RoiPopulationHeader overallConfidence={preview.overallConfidence} />

        {/* ESA Templates */}
        <RoiTemplatesSection templates={preview.templatesSuggested} />

        {/* Vendor Section */}
        {preview.existingVendor && <RoiVendorSection vendor={preview.existingVendor} />}

        {/* Services Section */}
        <RoiServicesSection
          services={preview.services}
          createServices={createServices}
          onCreateServicesChange={setCreateServices}
        />

        {/* Subcontractors Section */}
        <RoiSubcontractorsSection
          subcontractors={preview.subcontractors}
          selectedSubcontractors={selectedSubcontractors}
          onToggle={toggleSubcontractor}
          onSelectAll={selectAllSubcontractors}
          onDeselectAll={deselectAllSubcontractors}
        />

        {/* Summary & Action */}
        <RoiPopulationSummary
          vendorWillUpdate={preview.existingVendor?.willUpdate ?? false}
          servicesCount={preview.services.length}
          subcontractorsCount={preview.subcontractors.length}
          createServices={createServices}
          selectedSubcontractorsCount={selectedSubcontractors.length}
          populating={populating}
          canSubmit={canSubmit}
          error={error}
          onPopulate={handlePopulate}
        />
      </div>
    </TooltipProvider>
  );
}
