/**
 * RoI Engine
 *
 * Register of Information generation for ESA DORA compliance
 */

// Types & URL Utilities
export * from './types';
export { templateIdToUrl, urlToTemplateId, getTemplateUrl } from './types';

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
  // Action-oriented dashboard queries
  getNextActions,
  getPopulatableDocuments,
  getTemplatesWithStatus,
  TEMPLATE_NAMES,
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

// Onboarding Types (client-safe)
export {
  WIZARD_STEPS,
  type WizardStepId,
  type OnboardingProgress,
  type OnboardingStepData,
} from './onboarding-types';

// Onboarding Actions (server-only)
export {
  getOnboardingProgress,
  updateOnboardingStep,
  navigateToStep,
  getStepValidation,
  completeOnboarding,
  resetOnboarding,
} from './onboarding-actions';

// Pace Calculator
export {
  DEFAULT_MILESTONES,
  calculatePace,
  determineTrend,
  projectCompletion,
  analyzePace,
  getMilestonesWithStatus,
  formatDaysRemaining,
  type Milestone,
  type PaceAnalysis,
  type ProgressSnapshot,
} from './pace-calculator';

// Template Relationships
export {
  TEMPLATE_NODES,
  TEMPLATE_RELATIONSHIPS,
  GROUP_COLORS,
  calculateNodePositions,
  getPrerequisites,
  getDependents,
  getCompletionOrder,
  getRelationshipLabel,
  type TemplateNode,
  type TemplateRelationship,
} from './template-relationships';

// Submissions Types (client-safe)
export {
  SUBMISSION_CHECKLIST_TEMPLATE,
  getSubmissionStatusConfig,
  formatRelativeTime,
  type SubmissionStatus,
  type Submission,
  type SubmissionComment,
  type SubmissionChecklist,
  type ChecklistItem,
} from './submissions-types';

// Submissions Actions (server-only)
export {
  fetchSubmissions,
  fetchSubmission,
  createSubmissionDraft,
  updateSubmissionStatus,
  fetchSubmissionComments,
  addSubmissionComment,
  generateSubmissionChecklist,
} from './submissions';
