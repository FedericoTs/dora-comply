/**
 * Auth Types
 * Core type definitions for authentication system
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';

// ============================================================================
// User Types
// ============================================================================

export type UserRole = 'owner' | 'admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends SupabaseUser {
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

// ============================================================================
// Organization Types
// ============================================================================

export type EntityType =
  | 'financial_entity'
  | 'credit_institution'
  | 'investment_firm'
  | 'insurance_undertaking'
  | 'payment_institution'
  | 'ict_service_provider';

export interface Organization {
  id: string;
  name: string;
  lei: string | null;
  entityType: EntityType;
  jurisdiction: string;
  dataRegion: 'eu' | 'us';
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  allowedDomains: string[];
  defaultRole: UserRole;
}

// ============================================================================
// Auth State Types
// ============================================================================

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_LOCKED'
  | 'RATE_LIMITED'
  | 'WEAK_PASSWORD'
  | 'EMAIL_EXISTS'
  | 'INVALID_TOKEN'
  | 'SESSION_EXPIRED'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// ============================================================================
// Form Types
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  acceptTerms: boolean;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface NewPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface OnboardingFormData {
  organizationName: string;
  lei?: string;
  entityType: EntityType;
  jurisdiction: string;
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  primaryUseCase: 'vendor_assessment' | 'roi_generation' | 'incident_reporting' | 'full_compliance';
}

// ============================================================================
// Action Result Types
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface LoginResult {
  user: User;
  requiresMfa: boolean;
  requiresOnboarding: boolean;
  redirectTo: string;
}

export interface RegisterResult {
  user: User;
  requiresVerification: boolean;
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastActiveAt: string;
  userAgent: string;
  ipAddress: string;
  isCurrent: boolean;
}
