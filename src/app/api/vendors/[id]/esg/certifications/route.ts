/**
 * API Route: Vendor ESG Certifications
 *
 * GET /api/vendors/:id/esg/certifications - Get all certifications
 * POST /api/vendors/:id/esg/certifications - Add new certification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVendorESGCertifications, createESGCertification } from '@/lib/esg';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const certifications = await getVendorESGCertifications(id);
    return NextResponse.json(certifications);
  } catch (error) {
    console.error('Error fetching ESG certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESG certifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await createESGCertification({
      vendor_id: id,
      certification_name: body.certification_name,
      certification_type: body.certification_type,
      issuing_body: body.issuing_body,
      issue_date: body.issue_date,
      expiry_date: body.expiry_date,
      certificate_url: body.certificate_url,
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ certificationId: result.certificationId });
  } catch (error) {
    console.error('Error creating ESG certification:', error);
    return NextResponse.json(
      { error: 'Failed to create ESG certification' },
      { status: 500 }
    );
  }
}
