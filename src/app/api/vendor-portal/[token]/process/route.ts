/**
 * Vendor Portal Document Processing API
 *
 * POST /api/vendor-portal/[token]/process - Trigger AI extraction for documents
 * GET /api/vendor-portal/[token]/process - Get extraction status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { parseDocumentForAnswers, applyExtractedAnswers } from '@/lib/nis2-questionnaire/ai/parser';
import type { TemplateQuestion, DocumentType } from '@/lib/nis2-questionnaire/types';

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

    // Check for API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('[ProcessAPI] GOOGLE_GENERATIVE_AI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI extraction is not configured. Please contact support.' },
        { status: 503 }
      );
    }
    console.log('[ProcessAPI] API key configured');

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

    // Get template questions
    const { data: questions, error: questionsError } = await supabase
      .from('nis2_template_questions')
      .select('*')
      .eq('template_id', questionnaire.template_id)
      .order('display_order', { ascending: true });

    if (questionsError || !questions) {
      console.error('[ProcessAPI] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch template questions' },
        { status: 500 }
      );
    }

    console.log('[ProcessAPI] Found', questions.length, 'template questions');

    let totalExtracted = 0;
    let documentsProcessed = 0;
    const errors: string[] = [];

    // Process each document
    for (const doc of documents) {
      console.log('[ProcessAPI] Processing document:', doc.file_name, 'type:', doc.document_type);

      try {
        // Download document from storage
        console.log('[ProcessAPI] Downloading from path:', doc.storage_path);
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('questionnaire-documents')
          .download(doc.storage_path);

        if (downloadError || !fileData) {
          console.error('[ProcessAPI] Failed to download document:', downloadError);
          errors.push(`Failed to download ${doc.file_name}: ${downloadError?.message || 'Unknown error'}`);
          continue;
        }

        console.log('[ProcessAPI] Document downloaded, size:', fileData.size, 'bytes');

        // Convert to buffer
        const pdfBuffer = Buffer.from(await fileData.arrayBuffer());
        console.log('[ProcessAPI] Buffer created, size:', pdfBuffer.length, 'bytes');

        // Parse document
        console.log('[ProcessAPI] Starting AI extraction...');
        const result = await parseDocumentForAnswers({
          questionnaireId: questionnaire.id,
          documentId: doc.id,
          questions: questions as TemplateQuestion[],
          documentType: doc.document_type as DocumentType,
          pdfBuffer,
        });

        console.log('[ProcessAPI] Extraction result:', {
          success: result.success,
          extractedCount: result.extractedAnswers.length,
          error: result.error,
        });

        if (result.success && result.extractedAnswers.length > 0 && result.extractionId) {
          // Apply extracted answers
          console.log('[ProcessAPI] Applying', result.extractedAnswers.length, 'extracted answers...');
          const { applied, skipped } = await applyExtractedAnswers(
            questionnaire.id,
            result.extractedAnswers,
            result.extractionId
          );
          totalExtracted += applied;
          console.log('[ProcessAPI] Applied:', applied, 'Skipped:', skipped);

          // Update AI-filled count on questionnaire
          if (applied > 0) {
            // Get current count first
            const { data: currentQ } = await supabase
              .from('nis2_vendor_questionnaires')
              .select('questions_ai_filled')
              .eq('id', questionnaire.id)
              .single();

            const currentCount = currentQ?.questions_ai_filled || 0;
            await supabase
              .from('nis2_vendor_questionnaires')
              .update({ questions_ai_filled: currentCount + applied })
              .eq('id', questionnaire.id);
          }
        } else if (result.error) {
          errors.push(`${doc.file_name}: ${result.error}`);
        }

        documentsProcessed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ProcessAPI] Error processing document:', errorMessage);
        errors.push(`Error processing ${doc.file_name}: ${errorMessage}`);
      }
    }

    console.log('[ProcessAPI] Processing complete:', {
      documentsProcessed,
      totalExtracted,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      processed: documentsProcessed,
      extracted: totalExtracted,
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
