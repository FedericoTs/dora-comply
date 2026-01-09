/**
 * Sessions API
 *
 * GET: List active sessions for current user
 * DELETE: Revoke all other sessions
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  last_active_at: string | null;
  is_current: boolean;
}

// GET: List active sessions
export async function GET() {
  try {
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

    // Call the database function to get sessions
    const { data: sessions, error } = await supabase.rpc('get_user_sessions');

    if (error) {
      console.error('Get sessions error:', error);
      return NextResponse.json(
        { error: { message: 'Failed to get sessions' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: sessions || [] });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// DELETE: Revoke all other sessions
export async function DELETE() {
  try {
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

    // Call the database function to revoke other sessions
    const { data: deletedCount, error } = await supabase.rpc('revoke_other_sessions');

    if (error) {
      console.error('Revoke sessions error:', error);
      return NextResponse.json(
        { error: { message: 'Failed to revoke sessions' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { revoked: deletedCount },
      message: `Signed out of ${deletedCount} other session${deletedCount === 1 ? '' : 's'}`,
    });
  } catch (error) {
    console.error('Sessions DELETE error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
