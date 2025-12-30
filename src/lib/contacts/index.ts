/**
 * Vendor Contacts Module
 *
 * Exports all contact-related types, schemas, and actions
 */

// Types
export * from './types';

// Schemas
export * from './schema';

// Actions
export {
  createContact,
  updateContact,
  deleteContact,
  getVendorContacts,
} from './actions';
