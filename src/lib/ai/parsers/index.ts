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

// SOC 2 Parser Simple (Gemini-based, within timeout)
export {
  parseSOC2Simple,
  PARSER_VERSION_SIMPLE as SOC2_PARSER_VERSION_SIMPLE,
} from './soc2-parser-simple';

export type {
  SimpleParseOptions as SOC2SimpleParseOptions,
  SimpleParseResult as SOC2SimpleParseResult,
} from './soc2-parser-simple';

// ISO 27001 Parser
export {
  parseISO27001,
  ISO27001_PARSER_VERSION,
} from './iso27001-parser';

export type {
  ISO27001ParseOptions,
  ISO27001ParseResult,
  ParsedISO27001Certificate,
  ISO27001Control,
  ISO27001DatabaseRecord,
} from './iso27001-parser';

// Penetration Test Report Parser
export {
  parsePentestReport,
  PENTEST_PARSER_VERSION,
  getSeverityColor,
  getSeverityWeight,
  calculatePentestRiskScore,
} from './pentest-parser';

export type {
  PentestParseOptions,
  PentestParseResult,
  ParsedPentestReport,
  PentestVulnerability,
  PentestDatabaseRecord,
  VulnerabilitySeverity,
  VulnerabilityStatus,
  TestType,
} from './pentest-parser';

// Types
export * from './types';
