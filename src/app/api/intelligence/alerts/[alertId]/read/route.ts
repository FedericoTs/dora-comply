/**
 * POST /api/intelligence/alerts/[alertId]/read
 *
 * Mark an alert as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { markAlertsRead } from '@/lib/intelligence/queries';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ alertId: string }> }
) {
  const { alertId } = await context.params;

  try {
    const success = await markAlertsRead([alertId]);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark alert as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark alert read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark alert as read' },
      { status: 500 }
    );
  }
}
