/**
 * AI-to-RoI Data Population Pipeline
 *
 * This is the 10X differentiator - automatically populate RoI templates
 * from AI contract analysis results.
 *
 * Key capability: Upload contract → AI analyzes → RoI auto-populated
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ContractAnalysisResult, ExtractedParty } from '@/lib/ai/types';

// ============================================================================
// Types
// ============================================================================

export interface PopulateRoiResult {
  success: boolean;
  contractId?: string;
  vendorUpdated?: boolean;
  servicesCreated?: number;
  errors: string[];
  warnings: string[];
}

export interface RoiPopulationPreview {
  contractData: {
    contractRef: string;
    contractType: string;
    effectiveDate: string | null;
    expiryDate: string | null;
    governingLaw: string | null;
    complianceScore: number;
  };
  vendorData: {
    providerName: string | null;
    providerRole: string;
    existingVendorId?: string;
    needsCreation: boolean;
  };
  doraProvisions: {
    article30_2Score: number;
    article30_3Score: number;
    presentCount: number;
    partialCount: number;
    missingCount: number;
  };
  riskFlags: string[];
  complianceGaps: string[];
}

// ============================================================================
// Preview Functions
// ============================================================================

/**
 * Generate a preview of what RoI data will be populated from AI analysis
 */
export async function previewRoiPopulation(
  documentId: string
): Promise<{ success: boolean; preview?: RoiPopulationPreview; error?: string }> {
  const supabase = await createClient();

  // Fetch the parsed contract analysis
  const { data: analysis, error: analysisError } = await supabase
    .from('parsed_contracts')
    .select('*')
    .eq('document_id', documentId)
    .eq('status', 'completed')
    .single();

  if (analysisError || !analysis) {
    return {
      success: false,
      error: 'No completed AI analysis found for this document',
    };
  }

  // Extract provider from parties
  const parties = (analysis.identified_parties as ExtractedParty[]) || [];
  const provider = parties.find((p) => p.role === 'provider');
  const customer = parties.find((p) => p.role === 'customer');

  // Check if vendor already exists
  let existingVendorId: string | undefined;
  let needsVendorCreation = true;

  if (provider?.name) {
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, name')
      .ilike('name', `%${provider.name}%`)
      .limit(1)
      .single();

    if (existingVendor) {
      existingVendorId = existingVendor.id;
      needsVendorCreation = false;
    }
  }

  // Count DORA provision statuses
  const article30_2 = (analysis.article_30_2 as Record<string, { status: string }>) || {};
  const article30_3 = (analysis.article_30_3 as Record<string, { status: string }>) || {};

  const allProvisions = [
    ...Object.values(article30_2),
    ...Object.values(article30_3),
  ];

  const presentCount = allProvisions.filter((p) => p.status === 'present').length;
  const partialCount = allProvisions.filter((p) => p.status === 'partial').length;
  const missingCount = allProvisions.filter((p) => p.status === 'missing').length;

  // Extract risk flags and compliance gaps
  const riskFlags = ((analysis.risk_flags as { description: string }[]) || [])
    .map((r) => r.description)
    .slice(0, 5);

  const complianceGaps = ((analysis.compliance_gaps as { gap: string }[]) || [])
    .map((g) => g.gap)
    .slice(0, 5);

  const preview: RoiPopulationPreview = {
    contractData: {
      contractRef: `AI-${documentId.slice(0, 8).toUpperCase()}`,
      contractType: analysis.identified_contract_type || 'service_agreement',
      effectiveDate: analysis.identified_effective_date,
      expiryDate: analysis.identified_expiry_date,
      governingLaw: analysis.identified_governing_law,
      complianceScore: analysis.overall_compliance_score || 0,
    },
    vendorData: {
      providerName: provider?.name || null,
      providerRole: provider?.role || 'provider',
      existingVendorId,
      needsCreation: needsVendorCreation,
    },
    doraProvisions: {
      article30_2Score: analysis.article_30_2_score || 0,
      article30_3Score: analysis.article_30_3_score || 0,
      presentCount,
      partialCount,
      missingCount,
    },
    riskFlags,
    complianceGaps,
  };

  return { success: true, preview };
}

// ============================================================================
// Population Functions
// ============================================================================

/**
 * Populate RoI data from AI contract analysis
 *
 * This is the core 10X function - takes AI analysis and creates/updates:
 * 1. Vendor record (if provider identified)
 * 2. Contract record with DORA provisions
 * 3. ICT service record (if service details extracted)
 */
export async function populateRoiFromAnalysis(
  documentId: string,
  options: {
    createVendor?: boolean;
    useExistingVendorId?: string;
    contractRef?: string;
  } = {}
): Promise<PopulateRoiResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, errors: ['Not authenticated'] , warnings: [] };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, errors: ['No organization found'], warnings: [] };
  }

  const organizationId = userData.organization_id;

  // Fetch the parsed contract analysis
  const { data: analysis, error: analysisError } = await supabase
    .from('parsed_contracts')
    .select('*')
    .eq('document_id', documentId)
    .eq('organization_id', organizationId)
    .eq('status', 'completed')
    .single();

  if (analysisError || !analysis) {
    return {
      success: false,
      errors: ['No completed AI analysis found for this document'],
      warnings: [],
    };
  }

  let vendorId: string | undefined = options.useExistingVendorId;
  let vendorUpdated = false;

  // Step 1: Handle vendor
  const parties = (analysis.identified_parties as ExtractedParty[]) || [];
  const provider = parties.find((p) => p.role === 'provider');

  if (provider?.name && options.createVendor && !vendorId) {
    // Create new vendor
    const { data: newVendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        organization_id: organizationId,
        name: provider.name,
        status: 'pending_review',
        tier: 'tier_3', // Default, can be updated
        risk_score: 50, // Default neutral
      })
      .select('id')
      .single();

    if (vendorError) {
      errors.push(`Failed to create vendor: ${vendorError.message}`);
    } else if (newVendor) {
      vendorId = newVendor.id;
      vendorUpdated = true;
    }
  } else if (vendorId && provider?.name) {
    // Update existing vendor with any new info
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        // Could update additional fields from AI analysis
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (!updateError) {
      vendorUpdated = true;
    }
  }

  if (!vendorId) {
    warnings.push('No vendor linked - contract will be created without vendor association');
  }

  // Step 2: Create contract
  const contractRef = options.contractRef || `AI-${documentId.slice(0, 8).toUpperCase()}`;
  const contractType = mapContractType(analysis.identified_contract_type);

  const contractData: Record<string, unknown> = {
    organization_id: organizationId,
    contract_ref: contractRef,
    contract_type: contractType,
    effective_date: analysis.identified_effective_date || new Date().toISOString().split('T')[0],
    expiry_date: analysis.identified_expiry_date || null,
    governing_law_country: extractCountryCode(analysis.identified_governing_law),
    dora_provisions: {
      article_30_2: analysis.article_30_2,
      article_30_3: analysis.article_30_3,
      compliance_score: analysis.overall_compliance_score,
      confidence_score: analysis.confidence_score,
      analyzed_at: analysis.extracted_at,
    },
    document_ids: [documentId],
    notes: `Auto-populated from AI contract analysis on ${new Date().toISOString()}`,
    status: 'active',
  };

  if (vendorId) {
    contractData.vendor_id = vendorId;
  }

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .upsert(contractData, {
      onConflict: 'organization_id,contract_ref',
    })
    .select('id')
    .single();

  if (contractError) {
    return {
      success: false,
      errors: [`Failed to create contract: ${contractError.message}`],
      warnings,
    };
  }

  // Step 3: Link the parsed_contracts record to the contract
  await supabase
    .from('parsed_contracts')
    .update({ contract_id: contract.id })
    .eq('id', analysis.id);

  // Step 4: Create ICT service if we have enough info
  let servicesCreated = 0;

  if (vendorId && contract.id) {
    // Try to create a basic ICT service record
    const { error: serviceError } = await supabase
      .from('ict_services')
      .insert({
        contract_id: contract.id,
        vendor_id: vendorId,
        organization_id: organizationId,
        service_name: `Services under ${contractRef}`,
        service_type: 'other',
        criticality_level: 'non_critical', // Default, needs assessment
        service_start_date: analysis.identified_effective_date,
        service_end_date: analysis.identified_expiry_date,
      });

    if (!serviceError) {
      servicesCreated = 1;
    } else {
      warnings.push(`Could not create ICT service: ${serviceError.message}`);
    }
  }

  // Revalidate RoI pages
  revalidatePath('/roi');
  revalidatePath('/documents');

  return {
    success: true,
    contractId: contract.id,
    vendorUpdated,
    servicesCreated,
    errors,
    warnings,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapContractType(aiType: string | null): string {
  if (!aiType) return 'service_agreement';

  const typeMap: Record<string, string> = {
    'Master Service Agreement': 'master_agreement',
    'MSA': 'master_agreement',
    'Service Agreement': 'service_agreement',
    'SLA': 'sla',
    'Service Level Agreement': 'sla',
    'NDA': 'nda',
    'Non-Disclosure Agreement': 'nda',
    'DPA': 'dpa',
    'Data Processing Agreement': 'dpa',
    'Statement of Work': 'statement_of_work',
    'SOW': 'statement_of_work',
    'Amendment': 'amendment',
  };

  // Check for partial matches
  const lowerType = aiType.toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (lowerType.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'other';
}

function extractCountryCode(governingLaw: string | null): string | null {
  if (!governingLaw) return null;

  const lowerLaw = governingLaw.toLowerCase();

  // Common governing law to country mappings
  const lawToCountry: Record<string, string> = {
    'finnish': 'FI',
    'finland': 'FI',
    'english': 'GB',
    'england': 'GB',
    'uk': 'GB',
    'german': 'DE',
    'germany': 'DE',
    'french': 'FR',
    'france': 'FR',
    'dutch': 'NL',
    'netherlands': 'NL',
    'spanish': 'ES',
    'spain': 'ES',
    'italian': 'IT',
    'italy': 'IT',
    'irish': 'IE',
    'ireland': 'IE',
    'swedish': 'SE',
    'sweden': 'SE',
    'belgian': 'BE',
    'belgium': 'BE',
    'austrian': 'AT',
    'austria': 'AT',
    'swiss': 'CH',
    'switzerland': 'CH',
    'luxembourgish': 'LU',
    'luxembourg': 'LU',
    'portuguese': 'PT',
    'portugal': 'PT',
    'polish': 'PL',
    'poland': 'PL',
    'danish': 'DK',
    'denmark': 'DK',
    'norwegian': 'NO',
    'norway': 'NO',
    'new york': 'US',
    'delaware': 'US',
    'california': 'US',
    'american': 'US',
  };

  for (const [keyword, code] of Object.entries(lawToCountry)) {
    if (lowerLaw.includes(keyword)) {
      return code;
    }
  }

  return null;
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Get all documents with completed AI analysis that haven't been populated to RoI
 */
export async function getUnpopulatedAnalyses(): Promise<{
  success: boolean;
  documents: Array<{
    documentId: string;
    filename: string;
    analyzedAt: string;
    complianceScore: number;
    providerName: string | null;
  }>;
}> {
  const supabase = await createClient();

  const { data: analyses, error } = await supabase
    .from('parsed_contracts')
    .select(`
      document_id,
      extracted_at,
      overall_compliance_score,
      identified_parties,
      contract_id,
      document:documents(filename)
    `)
    .eq('status', 'completed')
    .is('contract_id', null)
    .order('extracted_at', { ascending: false });

  if (error) {
    return { success: false, documents: [] };
  }

  const documents = (analyses || []).map((a) => {
    const parties = (a.identified_parties as ExtractedParty[]) || [];
    const provider = parties.find((p) => p.role === 'provider');

    return {
      documentId: a.document_id,
      filename: (a.document as { filename?: string })?.filename || 'Unknown',
      analyzedAt: a.extracted_at,
      complianceScore: a.overall_compliance_score || 0,
      providerName: provider?.name || null,
    };
  });

  return { success: true, documents };
}
