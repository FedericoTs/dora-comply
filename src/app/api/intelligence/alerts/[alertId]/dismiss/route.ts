/**
 * POST /api/intelligence/alerts/[alertId]/dismiss
 *
 * Dismiss an alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { dismissAlerts } from '@/lib/intelligence/queries';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ alertId: string }> }
) {
  const { alertId } = await context.params;

  try {
    const success = await dismissAlerts([alertId]);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to dismiss alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500 }
    );
  }
}
