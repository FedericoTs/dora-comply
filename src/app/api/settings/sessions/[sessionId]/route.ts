/**
 * Individual Session API
 *
 * DELETE: Revoke a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

// DELETE: Revoke a specific session
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Call the database function to revoke the session
    const { error } = await supabase.rpc('revoke_session', {
      session_id: sessionId,
    });

    if (error) {
      console.error('Revoke session error:', error);

      // Handle specific error messages
      if (error.message.includes('Cannot revoke current session')) {
        return NextResponse.json(
          { error: { message: 'Cannot revoke your current session. Use sign out instead.' } },
          { status: 400 }
        );
      }

      if (error.message.includes('not found or access denied')) {
        return NextResponse.json(
          { error: { message: 'Session not found' } },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: { message: 'Failed to revoke session' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { id: sessionId },
      message: 'Session revoked successfully',
    });
  } catch (error) {
    console.error('Session DELETE error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
