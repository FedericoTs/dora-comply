/**
 * Contract Calendar Events API
 * GET /api/contracts/calendar - Fetch calendar events for date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContractCalendarEvents } from '@/lib/contracts/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  try {
    const events = await getContractCalendarEvents(startDate, endDate);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
