/**
 * Vendor Portal Document Download API
 *
 * GET /api/vendor-portal/[token]/documents/[documentId]/download - Download document
 *
 * Returns the PDF file for viewing in the PDF viewer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface RouteParams {
  params: Promise<{ token: string; documentId: string }>;
}

/**
 * Download document
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token, documentId } = await params;

    const supabase = createServiceRoleClient();

    // Validate token
    const { data: questionnaire, error: tokenError } = await supabase
      .from('nis2_vendor_questionnaires')
      .select('id, status, token_expires_at')
      .eq('access_token', token)
      .single();

    if (tokenError || !questionnaire) {
      return NextResponse.json({ error: 'Invalid access link' }, { status: 401 });
    }

    if (new Date(questionnaire.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Access link has expired' }, { status: 410 });
    }

    // Get document record
    const { data: document, error: docError } = await supabase
      .from('nis2_questionnaire_documents')
      .select('storage_path, file_name, file_type')
      .eq('id', documentId)
      .eq('questionnaire_id', questionnaire.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Download from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('questionnaire-documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Return the file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': document.file_type || 'application/pdf',
        'Content-Disposition': `inline; filename="${document.file_name}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
