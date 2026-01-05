/**
 * SOC 2 Document Parsing API Route
 *
 * POST /api/documents/[id]/parse-soc2
 *
 * Triggers async parsing of a SOC 2 report via Modal.com.
 * Returns immediately with a job ID for progress tracking.
 *
 * Architecture:
 *   Vercel (fast) → Modal (long-running) → Supabase (data)
 *
 * The frontend subscribes to extraction_jobs via Supabase Realtime
 * to get live progress updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: documentId } = await params;

  // Read env vars inside handler to ensure fresh values in serverless
  // Note: .trim() is needed because Vercel env vars may have trailing newlines
  const MODAL_PARSE_SOC2_URL = process.env.MODAL_PARSE_SOC2_URL?.trim();
  const MODAL_AUTH_KEY = process.env.MODAL_AUTH_KEY?.trim();
  const MODAL_AUTH_SECRET = process.env.MODAL_AUTH_SECRET?.trim();
  const USE_MODAL_PARSING = process.env.USE_MODAL_PARSING?.trim() === 'true';

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

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, filename, storage_path, mime_type, type, vendor_id, organization_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('[parse-soc2] Document query error:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify document is a SOC 2 report
    if (document.type !== 'soc2') {
      return NextResponse.json(
        { error: 'Document is not a SOC 2 report' },
        { status: 400 }
      );
    }

    // Check if already parsed
    const { data: existingParsed } = await supabase
      .from('parsed_soc2')
      .select('id, created_at')
      .eq('document_id', documentId)
      .single();

    if (existingParsed) {
      return NextResponse.json(
        {
          error: 'Document already parsed',
          parsedId: existingParsed.id,
          parsedAt: existingParsed.created_at,
        },
        { status: 409 }
      );
    }

    // Check if there's an active extraction job
    const { data: activeJob } = await supabase
      .from('extraction_jobs')
      .select('id, status, progress_percentage, current_message')
      .eq('document_id', documentId)
      .not('status', 'in', '("complete","failed")')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (activeJob) {
      return NextResponse.json({
        success: true,
        message: 'Parsing already in progress',
        jobId: activeJob.id,
        status: activeJob.status,
        progress: activeJob.progress_percentage,
      });
    }

    // Create extraction job
    const serviceClient = createServiceRoleClient();
    const { data: job, error: jobError } = await serviceClient
      .from('extraction_jobs')
      .insert({
        document_id: documentId,
        organization_id: document.organization_id,
        status: 'pending',
        progress_percentage: 0,
        current_phase: 'initializing',
        current_message: 'Queued for parsing',
      })
      .select('id')
      .single();

    if (jobError || !job) {
      console.error('[parse-soc2] Failed to create job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create extraction job' },
        { status: 500 }
      );
    }

    // Use Modal for parsing - await initial response to confirm job started
    if (USE_MODAL_PARSING && MODAL_PARSE_SOC2_URL) {
      try {
        console.log(`[parse-soc2] Triggering Modal parsing for document ${documentId}, job ${job.id}`);
        console.log(`[parse-soc2] Modal URL: ${MODAL_PARSE_SOC2_URL}`);

        // Make request to Modal with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const modalResponse = await fetch(MODAL_PARSE_SOC2_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Modal-Key': MODAL_AUTH_KEY || '',
            'X-Modal-Secret': MODAL_AUTH_SECRET || '',
          },
          body: JSON.stringify({
            document_id: documentId,
            job_id: job.id,
            organization_id: document.organization_id,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!modalResponse.ok) {
          const errorText = await modalResponse.text();
          console.error(`[parse-soc2] Modal returned error: ${modalResponse.status} - ${errorText}`);
          throw new Error(`Modal error: ${modalResponse.status}`);
        }

        const modalResult = await modalResponse.json();
        console.log(`[parse-soc2] Modal accepted job:`, modalResult);

        // Update job status to show Modal is processing
        await serviceClient
          .from('extraction_jobs')
          .update({
            status: 'analyzing',
            progress_percentage: 5,
            current_message: 'Processing via Modal.com',
          })
          .eq('id', job.id);

        // Return success - Modal will update job progress via Supabase
        return NextResponse.json({
          success: true,
          message: 'Parsing started via Modal',
          jobId: job.id,
          documentId,
          status: 'analyzing',
        });
      } catch (err) {
        console.error('[parse-soc2] Modal request failed:', err);

        // Mark job as failed
        await serviceClient
          .from('extraction_jobs')
          .update({
            status: 'failed',
            error_message: `Modal unavailable: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        return NextResponse.json(
          { error: 'Modal parsing service unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    } else {
      // Legacy mode: Parse locally (will likely timeout on Vercel)
      console.warn('[parse-soc2] Modal parsing disabled, using legacy local parsing');
      console.warn('[parse-soc2] This may timeout on Vercel!');

      // Import legacy parser
      const { parseSOC2ReportV2 } = await import('@/lib/ai/parsers');

      // Start parsing in background (will likely be killed by Vercel timeout)
      (async () => {
        try {
          // Download PDF
          const { data: fileData } = await serviceClient.storage
            .from('documents')
            .download(document.storage_path);

          if (!fileData) {
            throw new Error('Failed to download document');
          }

          const arrayBuffer = await fileData.arrayBuffer();
          const pdfBuffer = Buffer.from(arrayBuffer);

          // Update job to analyzing
          await serviceClient
            .from('extraction_jobs')
            .update({
              status: 'analyzing',
              progress_percentage: 10,
              current_message: 'Analyzing document structure',
            })
            .eq('id', job.id);

          // Parse with legacy parser
          const result = await parseSOC2ReportV2({
            pdfBuffer,
            documentId,
            verbose: true,
          });

          if (!result.success || !result.databaseRecord) {
            throw new Error(result.error || 'Parsing failed');
          }

          // Store results (databaseRecord already contains document_id from parser)
          const { data: parsed } = await serviceClient
            .from('parsed_soc2')
            .insert({
              ...result.databaseRecord,
              document_id: documentId, // Ensure we use our documentId
            })
            .select('id')
            .single();

          // Complete job
          await serviceClient
            .from('extraction_jobs')
            .update({
              status: 'complete',
              progress_percentage: 100,
              parsed_soc2_id: parsed?.id,
              completed_at: new Date().toISOString(),
            })
            .eq('id', job.id);
        } catch (err) {
          console.error('[parse-soc2] Legacy parsing failed:', err);
          await serviceClient
            .from('extraction_jobs')
            .update({
              status: 'failed',
              error_message: err instanceof Error ? err.message : 'Unknown error',
              completed_at: new Date().toISOString(),
            })
            .eq('id', job.id);
        }
      })();
    }

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      message: 'Parsing started',
      jobId: job.id,
      documentId,
      status: 'pending',
    });
  } catch (error) {
    console.error('[parse-soc2] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check job status
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: documentId } = await params;

  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest job for this document
    const { data: job } = await supabase
      .from('extraction_jobs')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!job) {
      // Check if document is already parsed
      const { data: parsed } = await supabase
        .from('parsed_soc2')
        .select('id, created_at')
        .eq('document_id', documentId)
        .single();

      if (parsed) {
        return NextResponse.json({
          status: 'complete',
          parsedId: parsed.id,
          parsedAt: parsed.created_at,
        });
      }

      return NextResponse.json({ error: 'No extraction job found' }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress_percentage,
      phase: job.current_phase,
      message: job.current_message,
      expectedControls: job.expected_controls,
      extractedControls: job.extracted_controls,
      parsedId: job.parsed_soc2_id,
      error: job.error_message,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    });
  } catch (error) {
    console.error('[parse-soc2] Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
