'use server';

/**
 * Smart Import - Document-First Vendor Creation
 *
 * This module enables users to upload a document first, then automatically
 * extract and create a vendor from the document's content.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { scanDocument, type DocumentScanResult } from '@/lib/ai/document-scanner';
import { createVendor } from '@/lib/vendors/actions';
import type { CreateVendorFormData } from '@/lib/vendors/schemas';

// ============================================================================
// Types
// ============================================================================

export interface SmartImportScanResult {
  success: boolean;
  scan?: DocumentScanResult;
  suggestedVendor?: {
    name: string;
    website?: string;
    providerType?: string;
    headquartersCountry?: string;
    serviceTypes?: string[];
    supportsCriticalFunction?: boolean;
  };
  error?: string;
}

export interface SmartImportResult {
  success: boolean;
  vendorId?: string;
  vendorName?: string;
  documentId?: string;
  roiPopulated?: boolean;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserOrganization(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return userData?.organization_id || null;
}

function inferProviderType(docType: string, services: string[]): string | undefined {
  const servicesLower = services.map(s => s.toLowerCase()).join(' ');

  if (servicesLower.includes('cloud') || servicesLower.includes('aws') || servicesLower.includes('azure') || servicesLower.includes('gcp')) {
    return 'cloud_service_provider';
  }
  if (servicesLower.includes('data center') || servicesLower.includes('datacenter') || servicesLower.includes('hosting')) {
    return 'data_centre';
  }
  if (servicesLower.includes('network') || servicesLower.includes('connectivity')) {
    return 'network_provider';
  }
  if (docType === 'soc2' || docType === 'iso27001') {
    return 'ict_service_provider';
  }
  return 'ict_service_provider';
}

function inferServiceTypes(services: string[]): string[] {
  const mapped: string[] = [];
  const servicesLower = services.map(s => s.toLowerCase()).join(' ');

  if (servicesLower.includes('cloud') || servicesLower.includes('infrastructure')) {
    mapped.push('cloud_computing');
  }
  if (servicesLower.includes('saas') || servicesLower.includes('software')) {
    mapped.push('software_as_service');
  }
  if (servicesLower.includes('paas') || servicesLower.includes('platform')) {
    mapped.push('platform_as_service');
  }
  if (servicesLower.includes('iaas') || servicesLower.includes('infrastructure as')) {
    mapped.push('infrastructure_as_service');
  }
  if (servicesLower.includes('data') || servicesLower.includes('analytics')) {
    mapped.push('data_analytics');
  }
  if (servicesLower.includes('security') || servicesLower.includes('soc')) {
    mapped.push('security_services');
  }
  if (servicesLower.includes('payment') || servicesLower.includes('financial')) {
    mapped.push('payment_services');
  }

  return mapped.length > 0 ? mapped : ['other'];
}

// ============================================================================
// Scan Document for Vendor Info
// ============================================================================

export async function scanDocumentForVendor(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<SmartImportScanResult> {
  try {
    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Smart Import] ANTHROPIC_API_KEY not configured');
      // Return with filename extraction only
      return {
        success: true,
        suggestedVendor: {
          name: extractVendorNameFromTitle(fileName),
          serviceTypes: ['other'],
          supportsCriticalFunction: false,
        },
      };
    }

    // Only PDF is supported for AI scanning
    if (mimeType !== 'application/pdf') {
      return {
        success: true,
        suggestedVendor: {
          name: extractVendorNameFromTitle(fileName),
          serviceTypes: ['other'],
          supportsCriticalFunction: false,
        },
      };
    }

    // Use existing document scanner
    const scan = await scanDocument({
      pdfBuffer: Buffer.from(fileBuffer),
      apiKey,
    });

    if (!scan) {
      return {
        success: false,
        error: 'Failed to scan document. Please try again.',
      };
    }

    // Extract vendor suggestion from scan
    const suggestedVendor = {
      name: scan.parties?.[0]?.name || extractVendorNameFromTitle(scan.title || fileName),
      providerType: inferProviderType(scan.documentType || 'other', scan.keyServicesMentioned || []),
      headquartersCountry: undefined as string | undefined, // Will be set if found
      serviceTypes: inferServiceTypes(scan.keyServicesMentioned || []),
      supportsCriticalFunction: scan.likelyCriticalFunction || false,
    };

    // Try to extract country from parties
    const providerParty = scan.parties?.find(p => p.role === 'provider');
    if (providerParty?.name) {
      suggestedVendor.name = providerParty.name;
    }

    return {
      success: true,
      scan,
      suggestedVendor,
    };
  } catch (error) {
    console.error('Smart import scan error:', error);
    return {
      success: false,
      error: 'Failed to analyze document. Please try manual import.',
    };
  }
}

function extractVendorNameFromTitle(title: string): string {
  // Try to extract vendor name from document title
  // Remove common suffixes
  let name = title
    .replace(/\.(pdf|docx?|xlsx?)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s*(soc\s*2|iso\s*27001|pentest|contract|agreement|report)\s*/gi, ' ')
    .trim();

  // Take first part if it looks like "Vendor Name - Document Type"
  const parts = name.split(/\s*[-–—]\s*/);
  if (parts.length > 1 && parts[0].length > 2) {
    name = parts[0];
  }

  return name || 'New Vendor';
}

// ============================================================================
// Complete Smart Import (Create Vendor + Upload Document)
// ============================================================================

export async function completeSmartImport(
  file: File,
  vendorData: {
    name: string;
    website?: string;
    tier?: 'critical' | 'important' | 'standard';
    providerType?: string;
    headquartersCountry?: string;
    serviceTypes?: string[];
    supportsCriticalFunction?: boolean;
  },
  documentType: 'soc2' | 'iso27001' | 'pentest' | 'contract' | 'other' = 'other'
): Promise<SmartImportResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: 'You must be logged in to import documents',
    };
  }

  try {
    // Step 1: Create the vendor
    const vendorFormData: CreateVendorFormData = {
      name: vendorData.name,
      website: vendorData.website || '', // Domain for intelligence monitoring
      tier: vendorData.tier || 'standard',
      provider_type: vendorData.providerType as CreateVendorFormData['provider_type'],
      headquarters_country: vendorData.headquartersCountry || '',
      service_types: (vendorData.serviceTypes || []) as CreateVendorFormData['service_types'],
      applicable_frameworks: [], // Will be configured after import
      supports_critical_function: vendorData.supportsCriticalFunction || false,
      critical_functions: [],
      is_intra_group: false,
    };

    const vendorResult = await createVendor(vendorFormData);

    if (!vendorResult.success || !vendorResult.data) {
      return {
        success: false,
        error: vendorResult.error?.message || 'Failed to create vendor',
      };
    }

    const vendor = vendorResult.data;

    // Step 2: Upload the document
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${organizationId}/${vendor.id}/${timestamp}-${randomId}-${safeFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Document upload error:', uploadError);
      // Vendor was created but document failed - still return success with warning
      return {
        success: true,
        vendorId: vendor.id,
        vendorName: vendor.name,
        roiPopulated: vendorResult.roiPopulated,
        error: 'Vendor created but document upload failed. Please upload document separately.',
      };
    }

    // Step 3: Create document record
    const { data: { user } } = await supabase.auth.getUser();

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        vendor_id: vendor.id,
        type: documentType,
        filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        parsing_status: 'pending', // Will trigger AI analysis
        metadata: {
          uploaded_by: user?.id,
          upload_method: 'smart_import',
          original_filename: file.name,
        },
      })
      .select('id')
      .single();

    if (docError) {
      console.error('Document record error:', docError);
      return {
        success: true,
        vendorId: vendor.id,
        vendorName: vendor.name,
        roiPopulated: vendorResult.roiPopulated,
        error: 'Vendor created but document record failed.',
      };
    }

    // Step 4: Log activity
    await supabase.from('activity_log').insert({
      organization_id: organizationId,
      action: 'smart_import',
      entity_type: 'vendor',
      entity_id: vendor.id,
      entity_name: vendor.name,
      details: {
        document_id: document?.id,
        document_type: documentType,
        method: 'smart_import',
      },
    });

    revalidatePath('/vendors');
    revalidatePath('/documents');
    revalidatePath('/dashboard');
    revalidatePath('/roi');

    return {
      success: true,
      vendorId: vendor.id,
      vendorName: vendor.name,
      documentId: document?.id,
      roiPopulated: vendorResult.roiPopulated,
    };
  } catch (error) {
    console.error('Smart import error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during import',
    };
  }
}
