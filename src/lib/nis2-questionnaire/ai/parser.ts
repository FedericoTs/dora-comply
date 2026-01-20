/**
 * NIS2 Questionnaire Document Parser
 *
 * Parses security documents to extract questionnaire answers using AI
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type {
  TemplateQuestion,
  AIExtraction,
  ExtractedAnswer,
  ExtractionSummary,
  DocumentType,
} from '../types';
import {
  EXTRACTION_SYSTEM_PROMPT,
  generateExtractionPrompt,
  generateSOC2ExtractionPrompt,
  generateISO27001ExtractionPrompt,
  validateExtractionResult,
} from './extraction-prompt';

// Constants
const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 5000;
const RATE_LIMIT_RETRY_DELAY_MS = 30000; // 30 seconds for rate limits
const CONFIDENCE_THRESHOLD = 0.6;

interface ParseDocumentOptions {
  questionnaireId: string;
  documentId: string;
  questions: TemplateQuestion[];
  documentType: DocumentType;
  pdfBuffer: Buffer;
}

interface ParseResult {
  success: boolean;
  extractionId?: string;
  extractedAnswers: ExtractedAnswer[];
  summary: ExtractionSummary;
  error?: string;
}

/**
 * Parse a document and extract questionnaire answers
 */
export async function parseDocumentForAnswers(
  options: ParseDocumentOptions
): Promise<ParseResult> {
  const { questionnaireId, documentId, questions, documentType, pdfBuffer } = options;

  console.log('[Parser] Starting document parsing:', {
    questionnaireId,
    documentId,
    documentType,
    questionCount: questions.length,
    bufferSize: pdfBuffer.length,
  });

  const supabase = createServiceRoleClient();

  // Create extraction job record
  console.log('[Parser] Creating extraction job record...');
  const { data: extraction, error: insertError } = await supabase
    .from('nis2_ai_extractions')
    .insert({
      questionnaire_id: questionnaireId,
      document_id: documentId,
      status: 'processing',
      started_at: new Date().toISOString(),
      model_name: GEMINI_MODEL,
    })
    .select()
    .single();

  if (insertError || !extraction) {
    console.error('[Parser] Failed to create extraction record:', insertError);
    return {
      success: false,
      extractedAnswers: [],
      summary: createEmptySummary(questions.length),
      error: 'Failed to create extraction job',
    };
  }

  console.log('[Parser] Extraction job created:', extraction.id);

  try {
    // Select appropriate prompt based on document type
    console.log('[Parser] Selecting prompt for document type:', documentType);
    let userPrompt: string;
    if (documentType === 'soc2') {
      userPrompt = generateSOC2ExtractionPrompt(questions);
    } else if (documentType === 'iso27001') {
      userPrompt = generateISO27001ExtractionPrompt(questions);
    } else {
      userPrompt = generateExtractionPrompt(questions, documentType);
    }

    console.log('[Parser] User prompt length:', userPrompt.length);

    // Process with retries
    let result: unknown = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`[Parser] Attempt ${attempt + 1}/${MAX_RETRIES} - Calling Gemini API...`);
        // Call Gemini with PDF using Vercel AI SDK
        const pdfBase64 = pdfBuffer.toString('base64');
        console.log('[Parser] PDF base64 length:', pdfBase64.length);

        const response = await generateText({
          model: google(GEMINI_MODEL),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'file',
                  data: pdfBase64,
                  mediaType: 'application/pdf',
                },
                {
                  type: 'text',
                  text: `${EXTRACTION_SYSTEM_PROMPT}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          maxOutputTokens: 8192,
          temperature: 0,
        });

        const responseText = response.text;
        console.log('[Parser] Gemini response length:', responseText.length);
        console.log('[Parser] Response preview:', responseText.substring(0, 200));

        // Parse JSON from response
        result = extractJsonFromResponse(responseText);
        console.log('[Parser] Parsed result type:', typeof result);

        if (validateExtractionResult(result)) {
          console.log('[Parser] Extraction result validated successfully');
          break;
        }

        lastError = new Error('Invalid extraction result format');
        console.warn('[Parser] Invalid extraction result format, retrying...');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[Parser] Extraction attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < MAX_RETRIES - 1) {
          // Use longer delay for rate limit errors
          const isRateLimit = lastError.message.includes('429') ||
            lastError.message.includes('Resource exhausted') ||
            lastError.message.includes('rate limit');
          const delayMs = isRateLimit
            ? RATE_LIMIT_RETRY_DELAY_MS * (attempt + 1)
            : BASE_RETRY_DELAY_MS * (attempt + 1);
          console.log(`[Parser] Waiting ${delayMs}ms before retry (rate limit: ${isRateLimit})...`);
          await delay(delayMs);
        }
      }
    }

    if (!result || !validateExtractionResult(result)) {
      throw lastError || new Error('Failed to extract answers after retries');
    }

    const extractionResult = result as {
      extractions: Array<{
        question_id: string;
        answer: string | boolean | string[];
        confidence: number;
        citation: string;
        extraction_notes?: string;
      }>;
      summary?: {
        total_questions?: number;
        extracted_count?: number;
        high_confidence_count?: number;
        pages_analyzed?: number;
      };
    };

    // Process extracted answers
    console.log('[Parser] Processing', extractionResult.extractions.length, 'extractions');
    const extractedAnswers: ExtractedAnswer[] = extractionResult.extractions
      .filter((e) => e.confidence >= 0)
      .map((e) => ({
        question_id: e.question_id,
        answer: typeof e.answer === 'string' ? e.answer : JSON.stringify(e.answer),
        confidence: e.confidence,
        citation: e.citation,
        extraction_notes: e.extraction_notes,
      }));

    console.log('[Parser] Extracted', extractedAnswers.length, 'answers with positive confidence');

    // Calculate summary
    const summary: ExtractionSummary = {
      total_questions: questions.length,
      total_extracted: extractedAnswers.filter((a) => a.confidence > 0).length,
      high_confidence_count: extractedAnswers.filter((a) => a.confidence >= 0.8).length,
      medium_confidence_count: extractedAnswers.filter(
        (a) => a.confidence >= CONFIDENCE_THRESHOLD && a.confidence < 0.8
      ).length,
      low_confidence_count: extractedAnswers.filter(
        (a) => a.confidence > 0 && a.confidence < CONFIDENCE_THRESHOLD
      ).length,
      avg_confidence:
        extractedAnswers.length > 0
          ? extractedAnswers.reduce((sum, a) => sum + a.confidence, 0) / extractedAnswers.length
          : 0,
      document_pages_processed: extractionResult.summary?.pages_analyzed || 0,
    };

    // Update extraction record with results
    await supabase
      .from('nis2_ai_extractions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        extracted_answers: extractedAnswers,
        extraction_summary: summary,
      })
      .eq('id', extraction.id);

    // Update document as processed
    await supabase
      .from('nis2_questionnaire_documents')
      .update({
        ai_processed: true,
        ai_processed_at: new Date().toISOString(),
        ai_extraction_id: extraction.id,
      })
      .eq('id', documentId);

    return {
      success: true,
      extractionId: extraction.id,
      extractedAnswers,
      summary,
    };
  } catch (error) {
    console.error('Document parsing failed:', error);

    // Update extraction record with error
    await supabase
      .from('nis2_ai_extractions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: MAX_RETRIES,
      })
      .eq('id', extraction.id);

    return {
      success: false,
      extractionId: extraction.id,
      extractedAnswers: [],
      summary: createEmptySummary(questions.length),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply extracted answers to questionnaire
 */
export async function applyExtractedAnswers(
  questionnaireId: string,
  extractedAnswers: ExtractedAnswer[],
  extractionId: string
): Promise<{ applied: number; skipped: number }> {
  const supabase = createServiceRoleClient();

  let applied = 0;
  let skipped = 0;

  for (const extraction of extractedAnswers) {
    // Only apply answers above confidence threshold
    if (extraction.confidence < CONFIDENCE_THRESHOLD) {
      skipped++;
      continue;
    }

    try {
      // Check if answer already exists
      const { data: existing } = await supabase
        .from('nis2_questionnaire_answers')
        .select('id, source')
        .eq('questionnaire_id', questionnaireId)
        .eq('question_id', extraction.question_id)
        .single();

      // Don't overwrite manual or confirmed answers
      if (existing && !['ai_extracted'].includes(existing.source)) {
        skipped++;
        continue;
      }

      // Upsert answer
      const { error } = await supabase.from('nis2_questionnaire_answers').upsert(
        {
          questionnaire_id: questionnaireId,
          question_id: extraction.question_id,
          answer_text: extraction.answer,
          source: 'ai_extracted',
          ai_confidence: extraction.confidence,
          ai_citation: extraction.citation,
          ai_extraction_id: extractionId,
          vendor_confirmed: false,
        },
        {
          onConflict: 'questionnaire_id,question_id',
        }
      );

      if (error) {
        console.error('Failed to apply answer:', error);
        skipped++;
      } else {
        applied++;
      }
    } catch (error) {
      console.error('Error applying extracted answer:', error);
      skipped++;
    }
  }

  return { applied, skipped };
}

/**
 * Process all documents for a questionnaire
 */
export async function processQuestionnaireDocuments(
  questionnaireId: string,
  questions: TemplateQuestion[]
): Promise<{
  success: boolean;
  totalExtracted: number;
  documentsProcessed: number;
  error?: string;
}> {
  const supabase = createServiceRoleClient();

  // Get unprocessed documents
  const { data: documents, error: docsError } = await supabase
    .from('nis2_questionnaire_documents')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .eq('ai_processed', false);

  if (docsError || !documents || documents.length === 0) {
    return {
      success: true,
      totalExtracted: 0,
      documentsProcessed: 0,
    };
  }

  let totalExtracted = 0;
  let documentsProcessed = 0;

  for (const doc of documents) {
    try {
      // Download document from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('questionnaire-documents')
        .download(doc.storage_path);

      if (downloadError || !fileData) {
        console.error('Failed to download document:', downloadError);
        continue;
      }

      // Convert to buffer
      const pdfBuffer = Buffer.from(await fileData.arrayBuffer());

      // Parse document
      const result = await parseDocumentForAnswers({
        questionnaireId,
        documentId: doc.id,
        questions,
        documentType: doc.document_type as DocumentType,
        pdfBuffer,
      });

      if (result.success && result.extractedAnswers.length > 0 && result.extractionId) {
        // Apply extracted answers
        const { applied } = await applyExtractedAnswers(
          questionnaireId,
          result.extractedAnswers,
          result.extractionId
        );
        totalExtracted += applied;
      }

      documentsProcessed++;
    } catch (error) {
      console.error('Error processing document:', error);
    }
  }

  return {
    success: true,
    totalExtracted,
    documentsProcessed,
  };
}

// Helper functions

function extractJsonFromResponse(text: string): unknown {
  // Try to find JSON in the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Try to parse the entire response as JSON
  try {
    return JSON.parse(text);
  } catch {
    // Try to find JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error('No valid JSON found in response');
  }
}

function createEmptySummary(totalQuestions: number): ExtractionSummary {
  return {
    total_questions: totalQuestions,
    total_extracted: 0,
    high_confidence_count: 0,
    medium_confidence_count: 0,
    low_confidence_count: 0,
    avg_confidence: 0,
    document_pages_processed: 0,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
