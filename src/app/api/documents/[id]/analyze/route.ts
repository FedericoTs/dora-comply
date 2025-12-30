/**
 * Contract Analysis API Endpoint
 *
 * POST /api/documents/[id]/analyze - Trigger AI analysis
 * GET /api/documents/[id]/analyze - Get analysis status/results
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeContractDocument, getContractAnalysis } from '@/lib/ai/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body = await request.json().catch(() => ({}));
    const { contractId, includeCriticalProvisions = true } = body;

    const result = await analyzeContractDocument(
      documentId,
      contractId,
      includeCriticalProvisions
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.code === 'UNAUTHORIZED' ? 401 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const analysis = await getContractAnalysis(documentId);

    if (!analysis) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'No analysis found for this document' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Get analysis API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
