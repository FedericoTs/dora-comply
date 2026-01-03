/**
 * Extraction Job Tracker
 *
 * Tracks SOC 2 parsing progress in the database for real-time updates.
 * Uses Supabase Realtime to push updates to the frontend.
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';

export interface JobProgress {
  status: 'pending' | 'analyzing' | 'extracting' | 'verifying' | 'mapping' | 'complete' | 'failed';
  progressPercentage: number;
  currentPhase?: string;
  currentMessage?: string;
  expectedControls?: number;
  extractedControls?: number;
  chunksTotal?: number;
  chunksCompleted?: number;
}

export interface ExtractionJob {
  id: string;
  documentId: string;
  organizationId: string;
  status: JobProgress['status'];
  progressPercentage: number;
  currentPhase?: string;
  currentMessage?: string;
  expectedControls?: number;
  extractedControls?: number;
  chunksTotal?: number;
  chunksCompleted?: number;
  parsedSoc2Id?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Create a new extraction job
 */
export async function createExtractionJob(
  documentId: string,
  organizationId: string
): Promise<ExtractionJob | null> {
  const supabase = createServiceRoleClient();

  // Check for existing active job
  const { data: existingJob } = await supabase
    .from('extraction_jobs')
    .select('id, status')
    .eq('document_id', documentId)
    .not('status', 'in', '("complete","failed")')
    .single();

  if (existingJob) {
    console.log(`[JobTracker] Existing job found: ${existingJob.id} (${existingJob.status})`);
    return null;
  }

  // Create new job
  const { data, error } = await supabase
    .from('extraction_jobs')
    .insert({
      document_id: documentId,
      organization_id: organizationId,
      status: 'pending',
      progress_percentage: 0,
      current_phase: 'Initializing',
      current_message: 'Starting SOC 2 extraction...',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[JobTracker] Failed to create job:', error);
    return null;
  }

  return mapToExtractionJob(data);
}

/**
 * Update job progress - called frequently during extraction
 */
export async function updateJobProgress(
  jobId: string,
  progress: Partial<JobProgress>
): Promise<void> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = {};

  if (progress.status !== undefined) updateData.status = progress.status;
  if (progress.progressPercentage !== undefined) updateData.progress_percentage = progress.progressPercentage;
  if (progress.currentPhase !== undefined) updateData.current_phase = progress.currentPhase;
  if (progress.currentMessage !== undefined) updateData.current_message = progress.currentMessage;
  if (progress.expectedControls !== undefined) updateData.expected_controls = progress.expectedControls;
  if (progress.extractedControls !== undefined) updateData.extracted_controls = progress.extractedControls;
  if (progress.chunksTotal !== undefined) updateData.chunks_total = progress.chunksTotal;
  if (progress.chunksCompleted !== undefined) updateData.chunks_completed = progress.chunksCompleted;

  const { error } = await supabase
    .from('extraction_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error('[JobTracker] Failed to update job:', error);
  }
}

/**
 * Mark job as complete with results
 */
export async function completeJob(
  jobId: string,
  parsedSoc2Id: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('extraction_jobs')
    .update({
      status: 'complete',
      progress_percentage: 100,
      current_phase: 'Complete',
      current_message: 'SOC 2 extraction completed successfully',
      parsed_soc2_id: parsedSoc2Id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('[JobTracker] Failed to complete job:', error);
  }
}

/**
 * Mark job as failed with error
 */
export async function failJob(
  jobId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('extraction_jobs')
    .update({
      status: 'failed',
      current_phase: 'Failed',
      current_message: errorMessage,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('[JobTracker] Failed to mark job as failed:', error);
  }
}

/**
 * Get job by document ID
 */
export async function getJobByDocumentId(
  documentId: string
): Promise<ExtractionJob | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('extraction_jobs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToExtractionJob(data);
}

/**
 * Map database row to ExtractionJob
 */
function mapToExtractionJob(row: Record<string, unknown>): ExtractionJob {
  return {
    id: row.id as string,
    documentId: row.document_id as string,
    organizationId: row.organization_id as string,
    status: row.status as JobProgress['status'],
    progressPercentage: row.progress_percentage as number,
    currentPhase: row.current_phase as string | undefined,
    currentMessage: row.current_message as string | undefined,
    expectedControls: row.expected_controls as number | undefined,
    extractedControls: row.extracted_controls as number | undefined,
    chunksTotal: row.chunks_total as number | undefined,
    chunksCompleted: row.chunks_completed as number | undefined,
    parsedSoc2Id: row.parsed_soc2_id as string | undefined,
    errorMessage: row.error_message as string | undefined,
    startedAt: row.started_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
  };
}

/**
 * Progress message templates for better UX
 */
export const PROGRESS_MESSAGES = {
  analyzing: [
    'Analyzing document structure...',
    'Identifying control sections...',
    'Counting expected controls...',
    'Creating extraction plan...',
  ],
  extracting: (chunk: number, total: number, controls: number) =>
    `Extracting chunk ${chunk}/${total} (${controls} controls found)`,
  verifying: (found: number, expected: number) =>
    `Verifying completeness (${found}/${expected} controls)`,
  mapping: [
    'Mapping controls to DORA requirements...',
    'Calculating coverage scores...',
    'Generating compliance report...',
  ],
  complete: (controls: number) =>
    `Extraction complete! Found ${controls} controls.`,
};
