import type { ParsedContractRecord } from '@/lib/ai/types';
import type { Contract } from '@/lib/contracts/types';

export interface DocumentAIAnalysisCardProps {
  documentId: string;
  documentType: string;
  mimeType: string;
  vendorId?: string | null;
  vendorName?: string | null;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError?: string | null;
  existingAnalysis?: ParsedContractRecord | null;
  vendorContracts?: Contract[];
}

export type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'failed';

export type { ParsedContractRecord, Contract };
