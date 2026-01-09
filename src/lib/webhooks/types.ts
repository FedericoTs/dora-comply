/**
 * Webhook Types
 *
 * Types for the webhook notification system.
 */

export type WebhookEventType =
  | 'vendor.created'
  | 'vendor.updated'
  | 'vendor.deleted'
  | 'vendor.risk_changed'
  | 'document.uploaded'
  | 'document.parsed'
  | 'document.linked'
  | 'incident.created'
  | 'incident.classified'
  | 'incident.reported'
  | 'incident.closed'
  | 'roi.exported'
  | 'roi.submitted'
  | 'test.completed'
  | 'test.finding_created'
  | 'compliance.maturity_changed'
  | 'compliance.snapshot_created'
  | 'security.login'
  | 'security.mfa_enrolled'
  | 'security.role_changed';

export interface WebhookConfig {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  is_active: boolean;
  retry_count: number;
  timeout_ms: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  response_status?: number;
  response_body?: string;
  delivered_at?: string;
  failed_at?: string;
  retry_count: number;
  created_at: string;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  organization_id: string;
  data: Record<string, unknown>;
}

export const WEBHOOK_EVENT_CATEGORIES = {
  vendor: [
    'vendor.created',
    'vendor.updated',
    'vendor.deleted',
    'vendor.risk_changed',
  ],
  document: [
    'document.uploaded',
    'document.parsed',
    'document.linked',
  ],
  incident: [
    'incident.created',
    'incident.classified',
    'incident.reported',
    'incident.closed',
  ],
  roi: [
    'roi.exported',
    'roi.submitted',
  ],
  testing: [
    'test.completed',
    'test.finding_created',
  ],
  compliance: [
    'compliance.maturity_changed',
    'compliance.snapshot_created',
  ],
  security: [
    'security.login',
    'security.mfa_enrolled',
    'security.role_changed',
  ],
} as const;

export const WEBHOOK_EVENT_DESCRIPTIONS: Record<WebhookEventType, string> = {
  'vendor.created': 'New vendor added to the system',
  'vendor.updated': 'Vendor information updated',
  'vendor.deleted': 'Vendor removed from the system',
  'vendor.risk_changed': 'Vendor risk score or tier changed',
  'document.uploaded': 'New document uploaded',
  'document.parsed': 'Document AI parsing completed',
  'document.linked': 'Document linked to vendor',
  'incident.created': 'New incident reported',
  'incident.classified': 'Incident classification determined',
  'incident.reported': 'Incident report submitted to regulator',
  'incident.closed': 'Incident marked as resolved',
  'roi.exported': 'Register of Information exported',
  'roi.submitted': 'RoI submission created',
  'test.completed': 'Resilience test completed',
  'test.finding_created': 'New test finding documented',
  'compliance.maturity_changed': 'Maturity level changed',
  'compliance.snapshot_created': 'Compliance snapshot taken',
  'security.login': 'User logged in',
  'security.mfa_enrolled': 'MFA enrolled for user',
  'security.role_changed': 'User role changed',
};
