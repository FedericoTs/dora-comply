import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);
    const daysAhead = parseInt(searchParams.get('days') || '90', 10);

    // Calculate date range
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Get contracts expiring within the range
    const { data: contracts, error } = await supabase
      .from('vendor_contracts')
      .select(`
        id,
        vendor_id,
        contract_type,
        end_date,
        vendors!inner (
          id,
          name,
          organization_id
        )
      `)
      .eq('vendors.organization_id', userData.organization_id)
      .lte('end_date', futureDate.toISOString())
      .gte('end_date', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Include recently expired
      .order('end_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Calculate days until expiry
    const contractsWithExpiry = (contracts || []).map((contract) => {
      const endDate = new Date(contract.end_date);
      const diffMs = endDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

      // vendors is returned as single object due to !inner join
      const vendor = contract.vendors as unknown as { id: string; name: string; organization_id: string };

      return {
        id: contract.id,
        vendor_id: contract.vendor_id,
        vendor_name: vendor.name,
        contract_type: contract.contract_type,
        end_date: contract.end_date,
        days_until_expiry: daysUntilExpiry,
      };
    });

    return NextResponse.json({ contracts: contractsWithExpiry });
  } catch (error) {
    console.error('Error fetching expiring contracts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
