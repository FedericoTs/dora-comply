/**
 * Parsing Complete Webhook
 *
 * POST /api/webhooks/parsing-complete
 *
 * Called by Modal.com when SOC 2 parsing completes.
 * Triggers automatic maturity snapshot creation.
 *
 * Security: Validates Modal auth headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface WebhookPayload {
  document_id: string;
  job_id: string;
  vendor_id?: string;
  status: 'complete' | 'failed';
  error_message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify Modal authentication
    const modalKey = request.headers.get('X-Modal-Key');
    const modalSecret = request.headers.get('X-Modal-Secret');

    const expectedKey = process.env.MODAL_AUTH_KEY?.trim();
    const expectedSecret = process.env.MODAL_AUTH_SECRET?.trim();

    // Allow empty auth in development, require in production
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && (!modalKey || !modalSecret || modalKey !== expectedKey || modalSecret !== expectedSecret)) {
      console.error('[webhook] Invalid Modal authentication');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json() as WebhookPayload;
    // Note: error_message is available in payload for future error logging
    const { document_id, job_id, vendor_id, status } = payload;

    console.log(`[webhook] Parsing complete webhook received:`, {
      document_id,
      job_id,
      status,
      vendor_id,
    });

    // Only trigger snapshot on successful completion
    if (status !== 'complete') {
      console.log(`[webhook] Skipping snapshot - parsing status: ${status}`);
      return NextResponse.json({
        success: true,
        snapshotTriggered: false,
        reason: `Parsing status was ${status}, not complete`,
      });
    }

    // Check if auto-snapshots are enabled
    // Note: This uses service role since webhook doesn't have user context
    // We'll check at org level using the document's org
    const supabase = createServiceRoleClient();

    // Get document's organization
    const { data: doc } = await supabase
      .from('documents')
      .select('organization_id, vendor_id')
      .eq('id', document_id)
      .single();

    if (!doc) {
      console.error(`[webhook] Document not found: ${document_id}`);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check auto-snapshot settings for this org
    const { data: settings } = await supabase
      .from('maturity_snapshot_settings')
      .select('auto_snapshot_enabled')
      .eq('organization_id', doc.organization_id)
      .single();

    const autoEnabled = settings?.auto_snapshot_enabled ?? true;

    if (!autoEnabled) {
      console.log(`[webhook] Auto-snapshots disabled for org`);
      return NextResponse.json({
        success: true,
        snapshotTriggered: false,
        reason: 'Auto-snapshots disabled for organization',
      });
    }

    // Trigger the snapshot
    // Use vendor_id from payload if provided, else from document
    const finalVendorId = vendor_id || doc.vendor_id || undefined;

    // Create snapshot using service role client directly
    // (handleSoc2ParsingComplete uses user auth which we don't have in webhook)
    const today = new Date().toISOString().split('T')[0];

    // Check if today's snapshot already exists
    const { data: existing } = await supabase
      .from('maturity_snapshots')
      .select('id')
      .eq('organization_id', doc.organization_id)
      .is('vendor_id', finalVendorId || null)
      .eq('snapshot_date', today)
      .single();

    if (existing) {
      console.log(`[webhook] Snapshot already exists for today`);
      return NextResponse.json({
        success: true,
        snapshotTriggered: false,
        snapshotId: existing.id,
        reason: 'Snapshot already exists for today',
      });
    }

    // Get current compliance data for the org/vendor
    const complianceQuery = supabase
      .from('vendor_dora_compliance')
      .select('*');

    if (finalVendorId) {
      complianceQuery.eq('vendor_id', finalVendorId);
    } else {
      complianceQuery.eq('organization_id', doc.organization_id);
    }

    const { data: complianceData } = await complianceQuery;

    // Calculate aggregate maturity if we have compliance data
    let maturityLevel = 0;
    let maturityPercent = 0;
    let pillarLevels = { ict: 0, incident: 0, resilience: 0, thirdParty: 0, infoShare: 0 };
    let pillarPercents = { ict: 0, incident: 0, resilience: 0, thirdParty: 0, infoShare: 0 };

    if (complianceData && complianceData.length > 0) {
      // Map labels to levels
      const labelToLevel = (label: string | null | undefined): number => {
        if (!label) return 0;
        if (label.includes('L4')) return 4;
        if (label.includes('L3')) return 3;
        if (label.includes('L2')) return 2;
        if (label.includes('L1')) return 1;
        return 0;
      };

      // Average across all compliance records
      const count = complianceData.length;
      let sumLevel = 0;
      let sumPercent = 0;
      let sumIct = 0, sumIncident = 0, sumResilience = 0, sumThirdParty = 0, sumInfoShare = 0;
      let sumIctP = 0, sumIncidentP = 0, sumResilienceP = 0, sumThirdPartyP = 0, sumInfoShareP = 0;

      for (const c of complianceData) {
        sumLevel += labelToLevel(c.overall_maturity_level);
        sumPercent += c.overall_readiness_percent || 0;
        sumIct += labelToLevel(c.pillar_ict_risk_mgmt);
        sumIncident += labelToLevel(c.pillar_incident_reporting);
        sumResilience += labelToLevel(c.pillar_resilience_testing);
        sumThirdParty += labelToLevel(c.pillar_third_party_risk);
        sumInfoShare += labelToLevel(c.pillar_info_sharing);
        sumIctP += c.pillar_ict_risk_mgmt_percent || 0;
        sumIncidentP += c.pillar_incident_reporting_percent || 0;
        sumResilienceP += c.pillar_resilience_testing_percent || 0;
        sumThirdPartyP += c.pillar_third_party_risk_percent || 0;
        sumInfoShareP += c.pillar_info_sharing_percent || 0;
      }

      maturityLevel = Math.round(sumLevel / count);
      maturityPercent = sumPercent / count;
      pillarLevels = {
        ict: Math.round(sumIct / count),
        incident: Math.round(sumIncident / count),
        resilience: Math.round(sumResilience / count),
        thirdParty: Math.round(sumThirdParty / count),
        infoShare: Math.round(sumInfoShare / count),
      };
      pillarPercents = {
        ict: sumIctP / count,
        incident: sumIncidentP / count,
        resilience: sumResilienceP / count,
        thirdParty: sumThirdPartyP / count,
        infoShare: sumInfoShareP / count,
      };
    }

    const maturityLabels = [
      'L0 - Not Performed',
      'L1 - Informal',
      'L2 - Planned & Tracked',
      'L3 - Well-Defined',
      'L4 - Quantitatively Managed',
    ];

    // Create snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('maturity_snapshots')
      .insert({
        organization_id: doc.organization_id,
        vendor_id: finalVendorId || null,
        snapshot_type: 'soc2_upload',
        snapshot_date: today,
        overall_maturity_level: maturityLevel,
        overall_maturity_label: maturityLabels[maturityLevel] || 'L0 - Not Performed',
        overall_readiness_percent: maturityPercent,
        pillar_ict_risk_mgmt: pillarLevels.ict,
        pillar_incident_reporting: pillarLevels.incident,
        pillar_resilience_testing: pillarLevels.resilience,
        pillar_third_party_risk: pillarLevels.thirdParty,
        pillar_info_sharing: pillarLevels.infoShare,
        pillar_ict_risk_mgmt_percent: pillarPercents.ict,
        pillar_incident_reporting_percent: pillarPercents.incident,
        pillar_resilience_testing_percent: pillarPercents.resilience,
        pillar_third_party_risk_percent: pillarPercents.thirdParty,
        pillar_info_sharing_percent: pillarPercents.infoShare,
        total_requirements: 64,
        requirements_met: 0,
        requirements_partial: 0,
        requirements_not_met: 64,
        critical_gaps_count: 0,
        high_gaps_count: 0,
        medium_gaps_count: 0,
        low_gaps_count: 0,
        critical_gaps: [],
        notes: `Auto-generated after SOC 2 parsing of document ${document_id}`,
      })
      .select('id')
      .single();

    if (snapshotError) {
      // Handle unique constraint violation gracefully
      if (snapshotError.code === '23505') {
        console.log(`[webhook] Snapshot already exists (race condition)`);
        return NextResponse.json({
          success: true,
          snapshotTriggered: false,
          reason: 'Snapshot already exists for today',
        });
      }

      console.error(`[webhook] Failed to create snapshot:`, snapshotError);
      return NextResponse.json(
        { error: 'Failed to create snapshot', details: snapshotError.message },
        { status: 500 }
      );
    }

    console.log(`[webhook] Created snapshot: ${snapshot.id}`);

    return NextResponse.json({
      success: true,
      snapshotTriggered: true,
      snapshotId: snapshot.id,
    });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
