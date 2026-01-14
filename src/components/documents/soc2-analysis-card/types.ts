export interface ParsedSOC2Summary {
  id: string;
  report_type: 'type1' | 'type2';
  audit_firm: string;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  period_start: string;
  period_end: string;
  criteria: string[];
  controls: unknown[];
  exceptions: unknown[];
  subservice_orgs: unknown[];
  cuecs: unknown[];
  confidence_scores: {
    overall: number;
    metadata: number;
    controls: number;
  };
  created_at: string;
}

export interface SOC2AnalysisCardProps {
  documentId: string;
  documentType: string;
  mimeType: string;
  vendorId?: string | null;
  vendorName?: string | null;
  existingAnalysis?: ParsedSOC2Summary | null;
}

export type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'failed';

export interface AnalysisProgress {
  progress: number;
  statusMessage: string;
  isPolling: boolean;
}
