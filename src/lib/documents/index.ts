/**
 * Document Management Module
 *
 * Re-exports all document-related types, schemas, actions, and queries.
 */

// Types
export * from './types';

// Schemas
export * from './schemas';

// Actions
export {
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  fetchDocumentsAction,
  getDocumentStats as getDocumentStatsAction,
  getDocumentsForVendor,
  type DocumentError,
  type DocumentErrorCode,
  type ActionResult,
} from './actions';

// Queries
export {
  getDocument,
  getDocumentWithVendor,
  getDocuments,
  getVendorDocuments,
  getDocumentStats,
  getRecentDocuments,
  getExpiringDocuments,
  getVendorDocumentCount,
} from './queries';
