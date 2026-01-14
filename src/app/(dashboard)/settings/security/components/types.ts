/**
 * Security Settings Types
 *
 * Shared types for security settings components
 */

import type { MFAFactor, AuthenticatorAssuranceLevel, UserRole } from '@/lib/auth/types';

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  last_active_at: string | null;
  is_current: boolean;
}

export interface MFADataState {
  factors: MFAFactor[];
  aalInfo: AuthenticatorAssuranceLevel | null;
  userRole: UserRole | null;
  isLoading: boolean;
}

export interface SessionsState {
  sessions: Session[];
  sessionsLoading: boolean;
  revokingSessionId: string | null;
  revokingAll: boolean;
}

// Roles that require MFA
export const MFA_REQUIRED_ROLES: UserRole[] = ['owner', 'admin'];

export type { MFAFactor, AuthenticatorAssuranceLevel, UserRole };
