/**
 * Vendor Chain API
 *
 * GET /api/vendors/[id]/chain - Returns supply chain graph for a specific vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildVendorChain, type ChainMetrics } from '@/lib/concentration/chain-utils';
import type { DependencyGraph } from '@/lib/concentration/types';

interface VendorChainResponse {
  vendor: {
    id: string;
    name: string;
    tier: string;
    service_types: string[];
  };
  chain: DependencyGraph;
  metrics: ChainMetrics;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user has access to this vendor
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build vendor chain
    const { vendor, graph, metrics } = await buildVendorChain(vendorId);

    const response: VendorChainResponse = {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        tier: vendor.tier,
        service_types: vendor.service_types || [],
      },
      chain: graph,
      metrics,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Vendor chain API error:', err);
    return NextResponse.json(
      { error: 'Failed to build vendor chain' },
      { status: 500 }
    );
  }
}
