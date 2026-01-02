/**
 * SOC 2 Analysis Export API
 *
 * Generates PDF or Excel exports of SOC 2 analysis data
 *
 * GET /api/documents/[id]/export?format=pdf|xlsx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateSOC2PDF,
  generateSOC2Excel,
  type SOC2ReportData,
} from '@/lib/exports/compliance-reports';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    if (!['pdf', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use pdf or xlsx.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch document with vendor info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        filename,
        vendor_id,
        vendors (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch parsed SOC 2 data
    const { data: parsedSoc2, error: soc2Error } = await supabase
      .from('parsed_soc2')
      .select('*')
      .eq('document_id', id)
      .single();

    if (soc2Error || !parsedSoc2) {
      return NextResponse.json(
        { error: 'SOC 2 analysis not found. Please parse the document first.' },
        { status: 404 }
      );
    }

    // Calculate DORA coverage
    const controls = parsedSoc2.controls || [];
    const doraCoverage = calculateDORACoverage(controls);

    // Prepare report data
    const vendorData = document.vendors as unknown;
    const vendor = (Array.isArray(vendorData) ? vendorData[0] : vendorData) as { id: string; name: string } | null;

    const reportData: SOC2ReportData = {
      documentName: document.filename,
      vendorName: vendor?.name,
      reportType: parsedSoc2.report_type,
      auditFirm: parsedSoc2.audit_firm,
      opinion: parsedSoc2.opinion,
      periodStart: parsedSoc2.period_start,
      periodEnd: parsedSoc2.period_end,
      criteria: parsedSoc2.criteria || [],
      controls: parsedSoc2.controls || [],
      exceptions: parsedSoc2.exceptions || [],
      subserviceOrgs: parsedSoc2.subservice_orgs || [],
      cuecs: parsedSoc2.cuecs || [],
      doraCoverage,
    };

    // Generate export
    let blob: Blob;
    let filename: string;
    let contentType: string;

    if (format === 'pdf') {
      blob = generateSOC2PDF(reportData);
      filename = `SOC2-Analysis-${document.filename.replace(/\.[^/.]+$/, '')}.pdf`;
      contentType = 'application/pdf';
    } else {
      blob = generateSOC2Excel(reportData);
      filename = `SOC2-Analysis-${document.filename.replace(/\.[^/.]+$/, '')}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Return file
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}

// Helper function to calculate DORA coverage
function calculateDORACoverage(controls: Array<{
  tscCategory?: string;
  testResult: string;
}>) {
  const coverageByPillar = {
    ICT_RISK: 0,
    INCIDENT: 0,
    RESILIENCE: 0,
    TPRM: 0,
    SHARING: 0,
  };

  // Count controls per TSC category
  const categoryCount: Record<string, { total: number; effective: number }> = {};
  for (const control of controls) {
    const cat = (control.tscCategory || '').replace(/\d+$/, '').toUpperCase();
    if (!categoryCount[cat]) categoryCount[cat] = { total: 0, effective: 0 };
    categoryCount[cat].total++;
    if (control.testResult === 'operating_effectively') {
      categoryCount[cat].effective++;
    }
  }

  // Map to DORA pillars
  const pillarMapping: Record<string, string[]> = {
    ICT_RISK: ['CC1', 'CC3', 'CC4', 'CC5', 'CC6', 'CC7', 'CC8'],
    INCIDENT: ['CC7'],
    RESILIENCE: ['A', 'CC7', 'CC9'],
    TPRM: ['CC9', 'C'],
    SHARING: [],
  };

  for (const [pillar, categories] of Object.entries(pillarMapping)) {
    if (categories.length === 0) continue;
    let pillarScore = 0;
    let catCount = 0;
    for (const cat of categories) {
      if (categoryCount[cat]) {
        const catScore = categoryCount[cat].total > 0
          ? (categoryCount[cat].effective / categoryCount[cat].total) * 100
          : 0;
        pillarScore += catScore;
        catCount++;
      }
    }
    coverageByPillar[pillar as keyof typeof coverageByPillar] = catCount > 0 ? Math.round(pillarScore / catCount) : 0;
  }

  const overall = Object.values(coverageByPillar).reduce((a, b) => a + b, 0) / 5;
  const gaps = Object.entries(coverageByPillar)
    .filter(([_, score]) => score < 50)
    .map(([pillar]) => pillar);

  return { overall: Math.round(overall), byPillar: coverageByPillar, gaps };
}
