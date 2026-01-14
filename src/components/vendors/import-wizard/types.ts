/**
 * Vendor Import Wizard Types
 */

import type { ParsedCSV, ColumnMapping, ImportPreview } from '@/lib/vendors/csv-import';

export type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export interface ImportResult {
  success: number;
  failed: number;
}

export interface WizardState {
  step: WizardStep;
  file: File | null;
  parsedCSV: ParsedCSV | null;
  mappings: ColumnMapping[];
  preview: ImportPreview | null;
  error: string | null;
  importProgress: number;
  importResult: ImportResult | null;
}

export interface StepConfig {
  id: WizardStep;
  title: string;
  description: string;
}

export const WIZARD_STEPS: StepConfig[] = [
  { id: 'upload', title: 'Upload File', description: 'Select a CSV file to import' },
  { id: 'mapping', title: 'Map Columns', description: 'Match CSV columns to vendor fields' },
  { id: 'preview', title: 'Preview', description: 'Review and validate data' },
  { id: 'importing', title: 'Importing', description: 'Creating vendors...' },
  { id: 'complete', title: 'Complete', description: 'Import finished' },
];
