/**
 * RoI Population Types
 *
 * Types for SOC2-to-RoI population feature.
 */

export interface RoiPopulationPreview {
  existingVendor: {
    id: string;
    name: string;
    willUpdate: boolean;
    auditInfo?: string;
  };
  services: RoiServicePreview[];
  subcontractors: RoiSubcontractorPreview[];
  templatesSuggested: RoiTemplatePreview[];
  overallConfidence: number;
}

export interface RoiServicePreview {
  name: string;
  type: string;
  description?: string;
  confidence: number;
}

export interface RoiSubcontractorPreview {
  name: string;
  serviceType?: string;
  inclusionMethod: string;
  hasOwnSoc2: boolean;
  confidence: number;
}

export interface RoiTemplatePreview {
  templateId: string;
  templateName: string;
  fieldsPopulated: number;
  totalFields: number;
  coverage: number;
  note?: string;
}

export interface ExistingMapping {
  id: string;
  status: string;
  isConfirmed: boolean;
  extractedAt: string;
}

export interface PopulateResult {
  success: boolean;
  mappingId?: string;
  vendorId?: string;
  vendorUpdated?: boolean;
  serviceIds?: string[];
  subcontractorIds?: string[];
  confidence?: number;
  errors?: string[];
  warnings?: string[];
  needsVendor?: boolean;
}

export interface RoiPopulationState {
  loading: boolean;
  populating: boolean;
  preview: RoiPopulationPreview | null;
  existingMapping: ExistingMapping | null;
  canPopulate: boolean;
  error: string | null;
  needsVendor: boolean;
  createServices: boolean;
  selectedSubcontractors: string[];
  populateResult: PopulateResult | null;
}
