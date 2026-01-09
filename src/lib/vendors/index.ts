/**
 * Vendor Module Exports
 *
 * Central export point for all vendor-related functionality.
 */

// Types
export * from './types';

// Schemas
export * from './schemas';

// Server Actions
export {
  createVendor,
  updateVendor,
  deleteVendor,
  restoreVendor,
  updateVendorStatus,
  bulkDeleteVendors,
  fetchVendorsAction,
  calculateAndSaveRiskScore,
  calculateAllVendorRiskScores,
  getVendorRiskBreakdown,
  type VendorError,
  type VendorErrorCode,
  type ActionResult,
} from './actions';

// Risk Scoring
export {
  calculateVendorRiskScore,
  calculateBatchRiskScores,
  getRiskDistribution,
  type RiskScoreInput,
  type RiskScoreResult,
  type RiskScoreResult as VendorRiskScoreResult,
  type RiskComponentBreakdown,
  type RiskComponent,
} from './risk-scoring';

// Queries
export {
  getVendors,
  getVendor,
  getVendorWithRelations,
  getVendorStats,
  getRecentVendors,
  getCriticalVendors,
  getVendorsNeedingReview,
  searchVendors,
  checkVendorExistsByLei,
  getVendorsForExport,
} from './queries';
