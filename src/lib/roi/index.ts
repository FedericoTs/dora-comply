/**
 * RoI Engine
 *
 * Register of Information generation for ESA DORA compliance
 */

// Types
export * from './types';

// Mappings
export {
  TEMPLATE_MAPPINGS,
  EBA_COUNTRY_CODES,
  EBA_ENTITY_TYPES,
  EBA_CONTRACT_TYPES,
  EBA_SERVICE_TYPES,
  EBA_CODE_TYPES,
  EBA_SENSITIVENESS,
  EBA_ENTITY_NATURE,
  EBA_PERSON_TYPES,
  EBA_SUBSTITUTABILITY,
  EBA_REINTEGRATION,
  EBA_IMPACT_LEVELS,
  EBA_CRITICALITY,
  EBA_ROLE_TYPES,
  ISO_CURRENCY_CODES,
  getColumnOrder,
  getTemplateFileName,
  getColumnMappings,
  type ColumnMapping,
  type TemplateMapping,
} from './mappings';

// Queries
export {
  fetchTemplateData,
  fetchAllTemplateStats,
  fetchB_01_01,
  fetchB_01_02,
  fetchB_01_03,
  fetchB_02_01,
  fetchB_02_02,
  fetchB_03_01,
  fetchB_03_02,
  fetchB_05_01,
  fetchB_05_02,
  fetchB_06_01,
  fetchB_07_01,
  type RoiStats,
} from './queries';

// Validation
export {
  validateTemplate,
  validateRoi,
  quickValidate,
  enhanceErrorsWithSuggestions,
  TEMPLATE_RULES,
  CROSS_FIELD_RULES,
  type EnhancedError,
  type ValidationRule,
  type FieldRules,
  type TemplateRules,
  type CrossFieldRule,
} from './validation';

// Export
export {
  generateCsv,
  generateAllCsvFiles,
  parseCsv,
  buildPackageFiles,
  buildPackageZip,
  buildRoiPackage,
  buildPackageWithProgress,
  generateParametersCsv,
  getDefaultParameters,
  parseParametersCsv,
  validateParameters,
  type CsvGeneratorOptions,
  type CsvGeneratorResult,
  type BuildPackageOptions,
  type PackageFile,
  type StreamingExportOptions,
} from './export';
