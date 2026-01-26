import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGDPRStats } from '@/lib/gdpr/queries';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const stats = await getGDPRStats(profile.organization_id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching GDPR stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GDPR stats' },
      { status: 500 }
    );
  }
}
