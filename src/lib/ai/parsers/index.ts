/**
 * AI Document Parsers
 *
 * Export all parser modules for AI-powered document extraction
 */

// SOC 2 Parser V1 (deprecated - use v2 for complete extraction)
export {
  parseSOC2Report,
  calculateDORACoverageScore,
  PARSER_VERSION as SOC2_PARSER_VERSION,
  PARSER_MODEL as SOC2_PARSER_MODEL,
} from './soc2-parser';

export type {
  ParseSOC2Options,
  ParseSOC2Result,
} from './soc2-parser';

// SOC 2 Parser V2 (multi-phase extraction with Haiku + Sonnet)
export {
  parseSOC2ReportV2,
  PARSER_VERSION_V2 as SOC2_PARSER_VERSION_V2,
} from './soc2-parser-v2';

export type {
  ParseSOC2V2Options,
  ParseSOC2V2Result,
  ExtractionProgress,
} from './soc2-parser-v2';

// SOC 2 Structure Analyzer (Haiku-based)
export {
  analyzeSOC2Structure,
  createExtractionChunks,
} from './soc2-structure-analyzer';

export type {
  SOC2DocumentStructure,
  DocumentSection,
} from './soc2-structure-analyzer';

// Types
export * from './types';
