/**
 * Document Quick Scan API Endpoint
 *
 * POST /api/documents/scan - Quick scan to identify document type
 * Uses Claude Haiku for fast, cheap document classification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanDocument, shouldAnalyzeForDora, mapScanToContractForm } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'CONFIG_ERROR', message: 'AI service not configured' } },
        { status: 500 }
      );
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Only PDF files are supported' } },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for quick scan)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'File too large. Maximum size is 10MB' } },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Perform quick scan with Haiku
    const scanResult = await scanDocument({
      pdfBuffer,
      apiKey,
    });

    // Determine if document should be analyzed for DORA compliance
    const shouldAnalyze = shouldAnalyzeForDora(scanResult);

    // Map to contract form suggestions
    const formSuggestions = mapScanToContractForm(scanResult);

    return NextResponse.json({
      success: true,
      data: {
        scan: scanResult,
        shouldAnalyzeForDora: shouldAnalyze,
        formSuggestions,
      },
    });
  } catch (error) {
    console.error('Document scan error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('scanned image')) {
        return NextResponse.json(
          { error: { code: 'SCAN_FAILED', message: 'Cannot read scanned/image PDFs. Please upload a text-based PDF.' } },
          { status: 400 }
        );
      }

      if (error.message.includes('Failed to extract text')) {
        return NextResponse.json(
          { error: { code: 'EXTRACTION_FAILED', message: 'Failed to read PDF content. The file may be corrupted or password-protected.' } },
          { status: 400 }
        );
      }

      // Return the actual error message in development for debugging
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred during document scan' } },
      { status: 500 }
    );
  }
}
