/**
 * Board Report Export API
 *
 * GET /api/board/report?format=pdf|pptx
 *
 * Generates executive-level DORA compliance reports for board presentations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBoardReportData } from '@/lib/actions/board-report-actions';
import { generateBoardReportPDF } from '@/lib/exports/board-report-pdf';
import { generateBoardReportPPTX } from '@/lib/exports/board-report-pptx';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get format from query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    if (format !== 'pdf' && format !== 'pptx') {
      return NextResponse.json(
        { error: 'Invalid format. Use "pdf" or "pptx"' },
        { status: 400 }
      );
    }

    // Optional date range
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const dateRange = fromParam && toParam
      ? { from: new Date(fromParam), to: new Date(toParam) }
      : undefined;

    // Fetch board report data
    const data = await getBoardReportData(dateRange);

    // Generate report
    let blob: Blob;
    let contentType: string;
    let filename: string;

    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'pptx') {
      blob = await generateBoardReportPPTX(data);
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      filename = `DORA-Board-Report-${dateStr}.pptx`;
    } else {
      blob = generateBoardReportPDF(data);
      contentType = 'application/pdf';
      filename = `DORA-Board-Report-${dateStr}.pdf`;
    }

    // Return file as response
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Board report generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
