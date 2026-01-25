/**
 * API Route: ESG Categories and Metrics
 *
 * GET /api/esg/categories - Get all ESG categories with their metrics
 */

import { NextResponse } from 'next/server';
import { getESGCategoriesWithMetrics } from '@/lib/esg';

export async function GET() {
  try {
    const categories = await getESGCategoriesWithMetrics();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching ESG categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESG categories' },
      { status: 500 }
    );
  }
}
