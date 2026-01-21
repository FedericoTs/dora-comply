/**
 * Vendor Portal Documents API
 *
 * POST /api/vendor-portal/[token]/documents - Upload document
 * GET /api/vendor-portal/[token]/documents - List documents
 * DELETE /api/vendor-portal/[token]/documents?id=xxx - Delete document
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { DocumentType } from '@/lib/nis2-questionnaire/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * Validate questionnaire token
 */
async function validateToken(token: string) {
  const supabase = createServiceRoleClient();

  const { data: questionnaire, error } = await supabase
    .from('nis2_vendor_questionnaires')
    .select('id, status, token_expires_at, organization_id')
    .eq('access_token', token)
    .single();

  if (error || !questionnaire) {
    return { valid: false, error: 'Invalid access link' };
  }

  if (new Date(questionnaire.token_expires_at) < new Date()) {
    return { valid: false, error: 'Access link has expired' };
  }

  if (!['draft', 'sent', 'in_progress', 'rejected'].includes(questionnaire.status)) {
    return { valid: false, error: 'Questionnaire cannot be edited' };
  }

  return { valid: true, questionnaire };
}

/**
 * Upload document
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Validate token
    const validation = await validateToken(token);
    if (!validation.valid || !validation.questionnaire) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Access link has expired' ? 410 : 401 }
      );
    }

    const questionnaire = validation.questionnaire;
    const supabase = createServiceRoleClient();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('document_type') as DocumentType;
    const documentTypeOther = formData.get('document_type_other') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF files are supported for AI extraction' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // Generate storage path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `questionnaires/${questionnaire.organization_id}/${questionnaire.id}/${timestamp}-${randomId}-${safeFilename}`;

    // Upload to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('questionnaire-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('nis2_questionnaire_documents')
      .insert({
        questionnaire_id: questionnaire.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        document_type: documentType,
        document_type_other: documentTypeOther,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('questionnaire-documents').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * List documents
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const validation = await validateToken(token);
    if (!validation.valid || !validation.questionnaire) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Access link has expired' ? 410 : 401 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: documents, error } = await supabase
      .from('nis2_questionnaire_documents')
      .select('*')
      .eq('questionnaire_id', validation.questionnaire.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch documents error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Delete document
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const validation = await validateToken(token);
    if (!validation.valid || !validation.questionnaire) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Access link has expired' ? 410 : 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get document to find storage path
    const { data: document, error: fetchError } = await supabase
      .from('nis2_questionnaire_documents')
      .select('storage_path')
      .eq('id', documentId)
      .eq('questionnaire_id', validation.questionnaire.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage
      .from('questionnaire-documents')
      .remove([document.storage_path]);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('nis2_questionnaire_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
