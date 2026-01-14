import type {
  ParsedContractRecord,
  ExtractedProvision,
  ExtractedArticle30_2,
  ExtractedArticle30_3,
  RiskFlag,
  ComplianceGap,
} from '@/lib/ai/types';

export interface ContractAnalysisResultsProps {
  analysis: ParsedContractRecord;
  showHeader?: boolean;
  onSignOffComplete?: () => void;
  onApplyToContract?: (analysisId: string) => void;
  contractId?: string;
}

export type ProvisionStatus = 'present' | 'partial' | 'missing' | 'unclear' | 'not_analyzed';

export interface StatusConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}

export type {
  ParsedContractRecord,
  ExtractedProvision,
  ExtractedArticle30_2,
  ExtractedArticle30_3,
  RiskFlag,
  ComplianceGap,
};
