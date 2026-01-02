/**
 * Incident Module
 *
 * DORA Article 19 - Major ICT-related incident reporting
 * Supports initial (4h), intermediate (72h), and final (1 month) reports
 */

// Types
export * from './types';

// Queries
export {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentReports,
  createIncidentReport,
  updateIncidentReport,
  submitIncidentReport,
  getIncidentEvents,
  addIncidentEvent,
  getIncidentStats,
  getPendingDeadlines,
  getServicesForIncident,
  getCriticalFunctionsForIncident,
  getVendorsForIncident,
} from './queries';

// Validation
export {
  incidentSchema,
  createIncidentSchema,
  updateIncidentSchema,
  reportContentSchema,
  createReportSchema,
  createEventSchema,
  incidentFiltersSchema,
  validateIncidentData,
  validateReportContent,
  suggestClassification,
  CLASSIFICATION_THRESHOLDS,
} from './validation';

// Server Actions
export {
  createIncidentAction,
  updateIncidentAction,
  deleteIncidentAction,
  createReportAction,
  submitReportAction,
  addEventAction,
} from './actions';
