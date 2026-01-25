/**
 * ESG (Environmental, Social, Governance) Module
 *
 * Provides functionality for assessing and tracking vendor ESG performance:
 * - Environmental: carbon emissions, energy usage, waste management
 * - Social: labor practices, diversity, health & safety
 * - Governance: board composition, ethics, transparency
 */

// Types
export * from './types';

// Queries
export {
  getESGCategories,
  getESGCategoriesWithMetrics,
  getESGMetrics,
  getVendorLatestESGAssessment,
  getVendorESGAssessments,
  getESGAssessment,
  getVendorESGCertifications,
  getVendorESGCommitments,
  getVendorESGHistory,
  getVendorESGProfile,
  getESGStats,
  calculateESGRiskLevel,
} from './queries';

// Actions
export {
  createESGAssessment,
  submitESGAssessment,
  deleteESGAssessment,
  createESGCertification,
  updateCertificationStatus,
  deleteESGCertification,
  createESGCommitment,
  updateCommitmentProgress,
  deleteESGCommitment,
} from './actions';
