import { NextRequest, NextResponse } from 'next/server';
import { getVendorTimelineEvents } from '@/lib/vendors/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '90', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const data = await getVendorTimelineEvents(id, { daysBack: days, limit });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timeline events' },
      { status: 500 }
    );
  }
}
