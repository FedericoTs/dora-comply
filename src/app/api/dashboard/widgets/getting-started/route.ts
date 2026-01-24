import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check various completion statuses
    const [vendorsResult, documentsResult, profileResult] = await Promise.all([
      supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', userData.organization_id)
        .is('deleted_at', null),
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', userData.organization_id),
      // Profile is complete if user has a name
      Promise.resolve({ complete: !!userData.full_name }),
    ]);

    const hasVendors = (vendorsResult.count || 0) > 0;
    const hasDocuments = (documentsResult.count || 0) > 0;
    const hasProfile = profileResult.complete;

    const items = [
      {
        id: '1',
        label: 'Add your first vendor',
        href: '/vendors/new',
        completed: hasVendors,
      },
      {
        id: '2',
        label: 'Upload a document',
        href: '/documents',
        completed: hasDocuments,
      },
      {
        id: '3',
        label: 'Complete your profile',
        href: '/settings',
        completed: hasProfile,
      },
      {
        id: '4',
        label: 'Set up notifications',
        href: '/settings/notifications',
        completed: false, // Could check notification preferences
      },
    ];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching getting started:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
