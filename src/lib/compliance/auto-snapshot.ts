'use server';

/**
 * Auto Snapshot Utility
 *
 * Handles automatic maturity snapshot creation after significant events:
 * - SOC 2 report parsing completion
 * - Vendor compliance assessment updates
 * - Gap remediation completions
 */

import { createClient } from '@/lib/supabase/server';
import { createMaturitySnapshot, getLatestSnapshot } from './maturity-history';
import type { SnapshotType } from './maturity-history-types';

interface AutoSnapshotResult {
  success: boolean;
  snapshotId?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * Trigger automatic snapshot after SOC 2 upload
 */
export async function triggerSoc2UploadSnapshot(
  vendorId?: string
): Promise<AutoSnapshotResult> {
  return triggerAutoSnapshot('soc2_upload', vendorId, 'SOC 2 report uploaded');
}

/**
 * Trigger automatic snapshot after compliance assessment
 */
export async function triggerAssessmentSnapshot(
  vendorId?: string
): Promise<AutoSnapshotResult> {
  return triggerAutoSnapshot('assessment', vendorId, 'Compliance assessment completed');
}

/**
 * Trigger automatic snapshot after gap remediation
 */
export async function triggerRemediationSnapshot(
  vendorId?: string
): Promise<AutoSnapshotResult> {
  return triggerAutoSnapshot('remediation', vendorId, 'Gap remediation completed');
}

/**
 * Create initial baseline snapshot
 */
export async function createBaselineSnapshot(
  vendorId?: string
): Promise<AutoSnapshotResult> {
  return triggerAutoSnapshot('baseline', vendorId, 'Initial baseline snapshot');
}

/**
 * Core snapshot trigger logic
 */
async function triggerAutoSnapshot(
  snapshotType: SnapshotType,
  vendorId?: string,
  notes?: string
): Promise<AutoSnapshotResult> {
  try {
    // Check if we should skip (e.g., already have today's snapshot)
    const shouldSkip = await shouldSkipSnapshot(vendorId);
    if (shouldSkip.skip) {
      console.log(
        `[AutoSnapshot] Skipping ${snapshotType} snapshot: ${shouldSkip.reason}`
      );
      return {
        success: true,
        skipped: true,
        reason: shouldSkip.reason,
      };
    }

    // Create the snapshot
    const result = await createMaturitySnapshot(snapshotType, vendorId, notes);

    if (!result.success) {
      console.error(`[AutoSnapshot] Failed to create ${snapshotType} snapshot:`, result.error);
      return {
        success: false,
        reason: result.error,
      };
    }

    console.log(
      `[AutoSnapshot] Created ${snapshotType} snapshot: ${result.data?.id}`
    );

    return {
      success: true,
      snapshotId: result.data?.id,
    };
  } catch (error) {
    console.error('[AutoSnapshot] Error:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if we should skip creating a snapshot
 * (e.g., if we already have today's snapshot)
 */
async function shouldSkipSnapshot(
  vendorId?: string
): Promise<{ skip: boolean; reason?: string }> {
  const latestResult = await getLatestSnapshot(vendorId);

  if (!latestResult.success || !latestResult.data) {
    return { skip: false };
  }

  const latest = latestResult.data;
  const latestDate = new Date(latest.snapshot_date).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  if (latestDate === today) {
    return {
      skip: true,
      reason: 'Snapshot already exists for today',
    };
  }

  return { skip: false };
}

/**
 * Webhook handler for Modal.com completion callbacks
 * This can be called when SOC 2 parsing completes
 */
export async function handleSoc2ParsingComplete(
  documentId: string,
  vendorId?: string
): Promise<AutoSnapshotResult> {
  try {
    const supabase = await createClient();

    // Get document info to find associated vendor
    let finalVendorId = vendorId;
    if (!finalVendorId) {
      const { data: doc } = await supabase
        .from('documents')
        .select('vendor_id')
        .eq('id', documentId)
        .single();

      finalVendorId = doc?.vendor_id ?? undefined;
    }

    // Trigger snapshot
    return await triggerSoc2UploadSnapshot(finalVendorId);
  } catch (error) {
    console.error('[AutoSnapshot] handleSoc2ParsingComplete error:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if automatic snapshots are enabled for the organization
 */
export async function isAutoSnapshotEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return true; // Default to enabled

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) return true;

    const { data: settings } = await supabase
      .from('maturity_snapshot_settings')
      .select('auto_snapshot_enabled')
      .eq('organization_id', profile.organization_id)
      .single();

    return settings?.auto_snapshot_enabled ?? true;
  } catch {
    return true; // Default to enabled on error
  }
}
