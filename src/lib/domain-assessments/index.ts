/**
 * Multi-Domain Risk Assessment Module
 *
 * Provides functionality for assessing vendors across multiple risk domains:
 * - Security
 * - Privacy
 * - Compliance
 * - Operational
 * - Financial
 *
 * Organizations can also create custom domains.
 */

// Types
export * from './types';

// Queries
export {
  getRiskDomains,
  getRiskDomain,
  getRiskDomainsWithCriteria,
  getDomainCriteria,
  getVendorAssessments,
  getAssessment,
  getVendorDomainAssessment,
  getVendorRiskProfile,
  getAssessmentHistory,
  getDomainStats,
  getVendorAssessmentSummaries,
} from './queries';

// Actions
export {
  createRiskDomain,
  updateRiskDomain,
  deleteRiskDomain,
  createCriterion,
  updateCriterion,
  deleteCriterion,
  startAssessment,
  submitAssessment,
  updateAssessment,
  deleteAssessment,
  initializeVendorAssessments,
} from './actions';
