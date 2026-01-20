/**
 * Vendor Portal Document Processing API
 *
 * POST /api/vendor-portal/[token]/process - Trigger AI extraction for documents
 * GET /api/vendor-portal/[token]/process - Get extraction status
 *
 * Uses Modal.com for heavy AI processing to avoid Vercel timeouts and rate limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// Modal endpoint for questionnaire parsing
const MODAL_PARSE_QUESTIONNAIRE_URL = process.env.MODAL_PARSE_QUESTIONNAIRE_URL;

/**
 * Validate questionnaire token
 */
async function validateToken(token: string) {
  const supabase = createServiceRoleClient();

  const { data: questionnaire, error } = await supabase
    .from('nis2_vendor_questionnaires')
    .select('id, status, token_expires_at, template_id, organization_id')
    .eq('access_token', token)
    .single();

  if (error || !questionnaire) {
    return { valid: false, error: 'Invalid access link' };
  }

  if (new Date(questionnaire.token_expires_at) < new Date()) {
    return { valid: false, error: 'Access link has expired' };
  }

  return { valid: true, questionnaire };
}

/**
 * Create extraction job in database
 */
async function createExtractionJob(
  questionnaireId: string,
  documentId: string,
  documentType: string
) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('nis2_ai_extractions')
    .insert({
      questionnaire_id: questionnaireId,
      document_id: documentId,
      status: 'pending',
      extraction_summary: {
        document_type: documentType,
        started_at: new Date().toISOString(),
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ProcessAPI] Failed to create extraction job:', error);
    throw new Error('Failed to create extraction job');
  }

  return data.id;
}

/**
 * Call Modal endpoint to start processing
 */
async function triggerModalProcessing(
  documentId: string,
  extractionId: string,
  questionnaireId: string
) {
  if (!MODAL_PARSE_QUESTIONNAIRE_URL) {
    throw new Error('MODAL_PARSE_QUESTIONNAIRE_URL is not configured');
  }

  console.log('[ProcessAPI] Calling Modal endpoint:', MODAL_PARSE_QUESTIONNAIRE_URL);

  const response = await fetch(MODAL_PARSE_QUESTIONNAIRE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document_id: documentId,
      extraction_id: extractionId,
      questionnaire_id: questionnaireId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ProcessAPI] Modal request failed:', response.status, errorText);
    throw new Error(`Modal processing failed: ${response.status}`);
  }

  const result = await response.json();
  console.log('[ProcessAPI] Modal response:', result);

  return result;
}

/**
 * Trigger AI extraction for all unprocessed documents
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  console.log('[ProcessAPI] Starting document processing...');

  try {
    const { token } = await params;
    console.log('[ProcessAPI] Token received:', token?.substring(0, 8) + '...');

    // Validate token
    const validation = await validateToken(token);
    if (!validation.valid || !validation.questionnaire) {
      console.log('[ProcessAPI] Token validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Access link has expired' ? 410 : 401 }
      );
    }

    const questionnaire = validation.questionnaire;
    console.log('[ProcessAPI] Questionnaire found:', questionnaire.id);

    const supabase = createServiceRoleClient();

    // Check Modal endpoint is configured
    if (!MODAL_PARSE_QUESTIONNAIRE_URL) {
      console.error('[ProcessAPI] MODAL_PARSE_QUESTIONNAIRE_URL is not configured');
      return NextResponse.json(
        { error: 'AI extraction is not configured. Please contact support.' },
        { status: 503 }
      );
    }
    console.log('[ProcessAPI] Modal endpoint configured');

    // Get unprocessed documents
    const { data: documents, error: docsError } = await supabase
      .from('nis2_questionnaire_documents')
      .select('*')
      .eq('questionnaire_id', questionnaire.id)
      .eq('ai_processed', false);

    if (docsError) {
      console.error('[ProcessAPI] Error fetching documents:', docsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    console.log('[ProcessAPI] Found', documents?.length || 0, 'unprocessed documents');

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No documents to process',
        processed: 0,
        extracted: 0,
      });
    }

    // Process each document via Modal
    const extractionJobs: { documentId: string; extractionId: string; fileName: string }[] = [];
    const errors: string[] = [];

    for (const doc of documents) {
      console.log('[ProcessAPI] Creating extraction job for:', doc.file_name);

      try {
        // Create extraction job in database
        const extractionId = await createExtractionJob(
          questionnaire.id,
          doc.id,
          doc.document_type
        );
        console.log('[ProcessAPI] Created extraction job:', extractionId);

        // Trigger Modal processing (fire-and-forget)
        await triggerModalProcessing(doc.id, extractionId, questionnaire.id);
        console.log('[ProcessAPI] Modal processing triggered for:', doc.file_name);

        extractionJobs.push({
          documentId: doc.id,
          extractionId,
          fileName: doc.file_name,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ProcessAPI] Error triggering processing:', errorMessage);
        errors.push(`Failed to process ${doc.file_name}: ${errorMessage}`);
      }
    }

    console.log('[ProcessAPI] Processing triggered:', {
      jobsCreated: extractionJobs.length,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Processing started for ${extractionJobs.length} document(s)`,
      jobs: extractionJobs,
      total_documents: documents.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ProcessAPI] Document processing error:', errorMessage);
    return NextResponse.json(
      { error: `Processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Get extraction status for questionnaire
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

    // Get all extractions for this questionnaire
    const { data: extractions, error } = await supabase
      .from('nis2_ai_extractions')
      .select(`
        *,
        document:nis2_questionnaire_documents!nis2_ai_extractions_document_id_fkey(
          id,
          file_name,
          document_type
        )
      `)
      .eq('questionnaire_id', validation.questionnaire.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch extractions error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch extraction status' },
        { status: 500 }
      );
    }

    // Get document processing status
    const { data: documents } = await supabase
      .from('nis2_questionnaire_documents')
      .select('id, file_name, ai_processed')
      .eq('questionnaire_id', validation.questionnaire.id);

    const processedCount = documents?.filter((d) => d.ai_processed).length || 0;
    const pendingCount = (documents?.length || 0) - processedCount;

    // Calculate overall stats
    const completedExtractions = extractions?.filter((e) => e.status === 'completed') || [];
    const totalExtracted = completedExtractions.reduce(
      (sum, e) => sum + (e.extraction_summary?.total_extracted || 0),
      0
    );
    const avgConfidence =
      completedExtractions.length > 0
        ? completedExtractions.reduce(
            (sum, e) => sum + (e.extraction_summary?.avg_confidence || 0),
            0
          ) / completedExtractions.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        extractions,
        summary: {
          total_documents: documents?.length || 0,
          processed_documents: processedCount,
          pending_documents: pendingCount,
          total_extracted: totalExtracted,
          avg_confidence: avgConfidence,
        },
      },
    });
  } catch (error) {
    console.error('Get extraction status error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
