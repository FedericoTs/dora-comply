/**
 * Vendor Contact Types
 *
 * Type definitions for vendor contacts management
 * Aligned with DORA RoI template B_02.02 requirements
 */

export type ContactType =
  | 'primary'
  | 'technical'
  | 'security'
  | 'commercial'
  | 'escalation';

export interface VendorContact {
  id: string;
  vendor_id: string;
  contact_type: ContactType;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface CreateContactInput {
  vendor_id: string;
  contact_type: ContactType;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

export interface UpdateContactInput {
  contact_type?: ContactType;
  name?: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
}

// Contact type metadata for UI
export const CONTACT_TYPE_INFO: Record<
  ContactType,
  { label: string; description: string; icon: string }
> = {
  primary: {
    label: 'Primary',
    description: 'Main point of contact for general inquiries',
    icon: 'user',
  },
  technical: {
    label: 'Technical',
    description: 'Technical support and integration contact',
    icon: 'code',
  },
  security: {
    label: 'Security',
    description: 'Security incidents and compliance contact',
    icon: 'shield',
  },
  commercial: {
    label: 'Commercial',
    description: 'Contract negotiations and billing contact',
    icon: 'briefcase',
  },
  escalation: {
    label: 'Escalation',
    description: 'Executive escalation for critical issues',
    icon: 'alert-triangle',
  },
};

export const CONTACT_TYPES = Object.keys(CONTACT_TYPE_INFO) as ContactType[];
