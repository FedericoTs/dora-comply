import { NextRequest, NextResponse } from 'next/server';
import { getVendorScoreHistory } from '@/lib/vendors/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '90', 10);

    const data = await getVendorScoreHistory(id, { daysBack: days });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching score history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch score history' },
      { status: 500 }
    );
  }
}
