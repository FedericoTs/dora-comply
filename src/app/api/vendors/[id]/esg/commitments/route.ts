/**
 * API Route: Vendor ESG Commitments
 *
 * GET /api/vendors/:id/esg/commitments - Get all commitments
 * POST /api/vendors/:id/esg/commitments - Add new commitment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVendorESGCommitments, createESGCommitment } from '@/lib/esg';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const commitments = await getVendorESGCommitments(id);
    return NextResponse.json(commitments);
  } catch (error) {
    console.error('Error fetching ESG commitments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESG commitments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await createESGCommitment({
      vendor_id: id,
      commitment_type: body.commitment_type,
      title: body.title,
      description: body.description,
      target_date: body.target_date,
      target_value: body.target_value,
      current_progress: body.current_progress,
      source_url: body.source_url,
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ commitmentId: result.commitmentId });
  } catch (error) {
    console.error('Error creating ESG commitment:', error);
    return NextResponse.json(
      { error: 'Failed to create ESG commitment' },
      { status: 500 }
    );
  }
}
