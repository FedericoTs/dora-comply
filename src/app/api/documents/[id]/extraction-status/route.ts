/**
 * Extraction Job Status API Route
 *
 * GET /api/documents/[id]/extraction-status
 *
 * Returns the current extraction job status for real-time progress tracking.
 * Frontend can poll this endpoint or use Supabase Realtime subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobByDocumentId } from '@/lib/ai/parsers/job-tracker';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: documentId } = await params;

  try {
    // Get authenticated Supabase client
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, organization_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get extraction job status
    const job = await getJobByDocumentId(documentId);

    if (!job) {
      // Check if document is already parsed
      const { data: parsedData } = await supabase
        .from('parsed_soc2')
        .select('id, created_at')
        .eq('document_id', documentId)
        .single();

      if (parsedData) {
        return NextResponse.json({
          status: 'complete',
          parsedId: parsedData.id,
          completedAt: parsedData.created_at,
          progressPercentage: 100,
          currentPhase: 'Complete',
          currentMessage: 'Extraction completed successfully',
        });
      }

      return NextResponse.json({
        status: 'not_started',
        progressPercentage: 0,
        currentPhase: null,
        currentMessage: 'No extraction job found',
      });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progressPercentage: job.progressPercentage,
      currentPhase: job.currentPhase,
      currentMessage: job.currentMessage,
      expectedControls: job.expectedControls,
      extractedControls: job.extractedControls,
      parsedSoc2Id: job.parsedSoc2Id,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error('[extraction-status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
