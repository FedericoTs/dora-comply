/**
 * SOC 2 Subservice Organization Auto-Linker
 *
 * Automatically creates/updates subcontractor records from parsed SOC 2 reports.
 * This populates the fourth-party supply chain graph from document intelligence.
 *
 * DORA Article 28(8) Compliance:
 * "Financial entities shall maintain a register of information on all subcontractors
 * that are part of ICT services chains supporting critical or important functions."
 */

import { createClient } from '@/lib/supabase/server';
import type { InclusionMethod } from './types';

// Normalized subservice org structure (handles both old and new formats)
interface NormalizedSubserviceOrg {
  name: string;
  serviceDescription: string;
  inclusionMethod: InclusionMethod;
  controlsSupported: string[];
  hasOwnSoc2: boolean;
  location: string | null;
}

// Result of auto-linking operation
export interface AutoLinkResult {
  success: boolean;
  documentId: string;
  vendorId: string | null;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  subcontractors: Array<{
    id: string;
    name: string;
    action: 'created' | 'updated' | 'skipped';
  }>;
}

/**
 * Normalize subservice org data to handle both legacy and current formats
 */
function normalizeSubserviceOrg(raw: Record<string, unknown>): NormalizedSubserviceOrg {
  // Handle legacy format (carveOut: boolean, pageRef: number)
  const isLegacyFormat = 'carveOut' in raw || 'pageRef' in raw;

  let inclusionMethod: InclusionMethod = 'carve_out';
  if (isLegacyFormat) {
    inclusionMethod = raw.carveOut === true ? 'carve_out' : 'inclusive';
  } else if (raw.inclusionMethod) {
    inclusionMethod = raw.inclusionMethod as InclusionMethod;
  }

  let location: string | null = null;
  if (raw.location && typeof raw.location === 'string') {
    location = raw.location;
  } else if (raw.pageRef && typeof raw.pageRef === 'number') {
    location = `Page ${raw.pageRef}`;
  }

  return {
    name: (raw.name as string) || 'Unknown',
    serviceDescription: (raw.serviceDescription as string) || '',
    inclusionMethod,
    controlsSupported: Array.isArray(raw.controlsSupported)
      ? raw.controlsSupported as string[]
      : [],
    hasOwnSoc2: Boolean(raw.hasOwnSoc2),
    location,
  };
}

/**
 * Infer service type from service description
 */
function inferServiceType(description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes('cloud') || desc.includes('infrastructure') || desc.includes('hosting')) {
    return 'cloud_infrastructure';
  }
  if (desc.includes('source code') || desc.includes('repository') || desc.includes('version control')) {
    return 'development_tools';
  }
  if (desc.includes('office') || desc.includes('email') || desc.includes('collaboration')) {
    return 'productivity_software';
  }
  if (desc.includes('security') || desc.includes('authentication') || desc.includes('identity')) {
    return 'security_services';
  }
  if (desc.includes('payment') || desc.includes('financial')) {
    return 'financial_services';
  }
  if (desc.includes('data') || desc.includes('analytics') || desc.includes('monitoring')) {
    return 'data_services';
  }
  if (desc.includes('communication') || desc.includes('messaging')) {
    return 'communication';
  }

  return 'other';
}

/**
 * Check if subcontractor supports critical controls
 */
function assessCriticality(controlsSupported: string[]): boolean {
  // Controls that indicate critical function support
  const criticalControls = [
    'CC6', // Logical and Physical Access Controls
    'CC7', // System Operations
    'CC8', // Change Management
    'A1',  // Availability
    'C1',  // Confidentiality
  ];

  return controlsSupported.some(control =>
    criticalControls.some(critical => control.startsWith(critical))
  );
}

/**
 * Auto-link subservice organizations from a parsed SOC 2 report
 * to the subcontractors table for fourth-party visibility.
 *
 * @param documentId - The UUID of the parsed document
 * @returns Result of the auto-linking operation
 */
export async function autoLinkSubserviceOrgs(documentId: string): Promise<AutoLinkResult> {
  const supabase = await createClient();
  const result: AutoLinkResult = {
    success: false,
    documentId,
    vendorId: null,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    subcontractors: [],
  };

  try {
    // 1. Fetch document to get vendor_id and organization_id
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, vendor_id, organization_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      result.errors.push(`Document not found: ${docError?.message || 'Unknown error'}`);
      return result;
    }

    if (!document.vendor_id) {
      result.errors.push('Document has no associated vendor');
      return result;
    }

    result.vendorId = document.vendor_id;

    // 2. Fetch parsed SOC 2 data
    const { data: parsedData, error: parsedError } = await supabase
      .from('parsed_soc2')
      .select('subservice_orgs')
      .eq('document_id', documentId)
      .single();

    if (parsedError || !parsedData) {
      result.errors.push(`Parsed SOC 2 data not found: ${parsedError?.message || 'Unknown error'}`);
      return result;
    }

    const subserviceOrgs = parsedData.subservice_orgs as Record<string, unknown>[] | null;

    if (!subserviceOrgs || !Array.isArray(subserviceOrgs) || subserviceOrgs.length === 0) {
      result.success = true; // Not an error, just no subservice orgs to link
      return result;
    }

    // 3. Fetch existing subcontractors for this vendor to check for duplicates
    const { data: existingSubcontractors } = await supabase
      .from('subcontractors')
      .select('id, subcontractor_name, source_document_id')
      .eq('vendor_id', document.vendor_id)
      .eq('organization_id', document.organization_id)
      .is('deleted_at', null);

    // Type for the Map entries
    type ExistingSubcontractor = {
      id: string;
      subcontractor_name: string;
      source_document_id: string | null;
    };

    const existingByName = new Map<string, ExistingSubcontractor>(
      (existingSubcontractors || []).map(s => [
        s.subcontractor_name.toLowerCase().trim(),
        s as ExistingSubcontractor
      ])
    );

    // 4. Process each subservice organization
    for (const rawOrg of subserviceOrgs) {
      const org = normalizeSubserviceOrg(rawOrg);
      const normalizedName = org.name.toLowerCase().trim();

      // Check if already exists
      const existing = existingByName.get(normalizedName);

      if (existing) {
        // Update if from same document, otherwise skip (don't overwrite)
        if (existing.source_document_id === documentId) {
          const { error: updateError } = await supabase
            .from('subcontractors')
            .update({
              service_description: org.serviceDescription,
              service_type: inferServiceType(org.serviceDescription),
              inclusion_method: org.inclusionMethod,
              controls_supported: org.controlsSupported,
              has_own_soc2: org.hasOwnSoc2,
              soc2_location_reference: org.location,
              supports_critical_function: assessCriticality(org.controlsSupported),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            result.errors.push(`Failed to update ${org.name}: ${updateError.message}`);
          } else {
            result.updated++;
            result.subcontractors.push({
              id: existing.id,
              name: org.name,
              action: 'updated',
            });
          }
        } else {
          // Already exists from different document, skip
          result.skipped++;
          result.subcontractors.push({
            id: existing.id,
            name: org.name,
            action: 'skipped',
          });
        }
      } else {
        // Create new subcontractor
        const { data: newSub, error: createError } = await supabase
          .from('subcontractors')
          .insert({
            vendor_id: document.vendor_id,
            organization_id: document.organization_id,
            subcontractor_name: org.name,
            tier_level: 1, // Fourth-party = tier 1 (direct subcontractor of vendor)
            service_description: org.serviceDescription,
            service_type: inferServiceType(org.serviceDescription),
            source_type: 'soc2_extraction',
            source_document_id: documentId,
            inclusion_method: org.inclusionMethod,
            controls_supported: org.controlsSupported,
            has_own_soc2: org.hasOwnSoc2,
            soc2_location_reference: org.location,
            supports_critical_function: assessCriticality(org.controlsSupported),
            is_monitored: false, // Default to unmonitored
            risk_rating: null, // Needs manual assessment
          })
          .select('id')
          .single();

        if (createError) {
          result.errors.push(`Failed to create ${org.name}: ${createError.message}`);
        } else if (newSub) {
          result.created++;
          result.subcontractors.push({
            id: newSub.id,
            name: org.name,
            action: 'created',
          });

          // Add to map to prevent duplicates within same batch
          existingByName.set(normalizedName, {
            id: newSub.id,
            subcontractor_name: org.name,
            source_document_id: documentId,
          });
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error) {
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Re-link all documents for an organization.
 * Useful for backfilling fourth-party data from existing parsed SOC 2 reports.
 *
 * @param organizationId - The organization to re-link documents for
 * @returns Summary of all auto-linking operations
 */
export async function relinkAllDocuments(organizationId: string): Promise<{
  success: boolean;
  processed: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: string[];
  results: AutoLinkResult[];
}> {
  const supabase = await createClient();

  const summary = {
    success: false,
    processed: 0,
    totalCreated: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    errors: [] as string[],
    results: [] as AutoLinkResult[],
  };

  try {
    // First, get all document IDs for this organization
    const { data: orgDocs, error: docsError } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId);

    if (docsError) {
      summary.errors.push(`Failed to fetch organization documents: ${docsError.message}`);
      return summary;
    }

    if (!orgDocs || orgDocs.length === 0) {
      summary.success = true;
      return summary;
    }

    const documentIds = orgDocs.map(d => d.id);

    // Find parsed SOC 2 documents with subservice orgs for this organization
    const { data: parsedDocs, error } = await supabase
      .from('parsed_soc2')
      .select('document_id')
      .in('document_id', documentIds)
      .not('subservice_orgs', 'is', null);

    if (error) {
      summary.errors.push(`Failed to fetch parsed documents: ${error.message}`);
      return summary;
    }

    if (!parsedDocs || parsedDocs.length === 0) {
      summary.success = true;
      return summary;
    }

    // Process each document
    for (const doc of parsedDocs) {
      const result = await autoLinkSubserviceOrgs(doc.document_id);
      summary.results.push(result);
      summary.processed++;
      summary.totalCreated += result.created;
      summary.totalUpdated += result.updated;
      summary.totalSkipped += result.skipped;

      if (result.errors.length > 0) {
        summary.errors.push(...result.errors.map(e => `[${doc.document_id}] ${e}`));
      }
    }

    summary.success = summary.errors.length === 0;
    return summary;

  } catch (error) {
    summary.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return summary;
  }
}
