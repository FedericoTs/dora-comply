'use server';

/**
 * Auth Audit Logging
 *
 * Records all authentication events for regulatory compliance.
 * Required for DORA/SOC 2 audit trails.
 */

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type AuthEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'mfa_enroll'
  | 'mfa_verify'
  | 'mfa_disable'
  | 'session_created'
  | 'session_revoked'
  | 'session_expired'
  | 'account_locked'
  | 'account_unlocked'
  | 'role_changed'
  | 'invitation_sent'
  | 'invitation_accepted';

export type AuthEventResult = 'success' | 'failure' | 'blocked';

interface LogAuthEventParams {
  userId?: string;
  organizationId?: string;
  eventType: AuthEventType;
  result: AuthEventResult;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get client IP address from headers
 */
async function getClientIp(): Promise<string | null> {
  const headersList = await headers();
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    null
  );
}

/**
 * Get user agent from headers
 */
async function getUserAgent(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('user-agent');
}

/**
 * Log an authentication event to the audit log
 */
export async function logAuthEvent({
  userId,
  organizationId,
  eventType,
  result,
  failureReason,
  metadata = {},
}: LogAuthEventParams): Promise<void> {
  try {
    const supabase = await createClient();
    const ipAddress = await getClientIp();
    const userAgent = await getUserAgent();

    await supabase.from('auth_audit_log').insert({
      user_id: userId || null,
      organization_id: organizationId || null,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: userAgent,
      result,
      failure_reason: failureReason || null,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the auth flow
    console.error('Failed to log auth event:', error);
  }
}

/**
 * Check if login is rate limited
 */
export async function checkLoginRateLimit(email: string): Promise<{
  isLimited: boolean;
  attemptsRemaining: number;
  lockedUntil: Date | null;
}> {
  try {
    const supabase = await createClient();
    const ipAddress = await getClientIp();

    const { data, error } = await supabase.rpc('check_login_rate_limit', {
      p_email: email,
      p_ip_address: ipAddress || '0.0.0.0',
      p_max_attempts: 5,
      p_window_minutes: 15,
    });

    if (error || !data?.[0]) {
      // If rate limiting fails, allow login (fail open)
      return { isLimited: false, attemptsRemaining: 5, lockedUntil: null };
    }

    const result = data[0];
    return {
      isLimited: result.is_limited,
      attemptsRemaining: result.attempts_remaining,
      lockedUntil: result.locked_until ? new Date(result.locked_until) : null,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { isLimited: false, attemptsRemaining: 5, lockedUntil: null };
  }
}

/**
 * Record a login attempt for rate limiting
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  failureReason?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const ipAddress = await getClientIp();
    const userAgent = await getUserAgent();

    await supabase.rpc('record_login_attempt', {
      p_email: email,
      p_ip_address: ipAddress || '0.0.0.0',
      p_success: success,
      p_user_agent: userAgent,
      p_failure_reason: failureReason || null,
    });
  } catch (error) {
    console.error('Failed to record login attempt:', error);
  }
}

/**
 * Check if user role requires MFA
 */
export function requiresMFA(role: string): boolean {
  return ['owner', 'admin'].includes(role);
}

/**
 * Get recent auth events for a user (for security page)
 */
export async function getRecentAuthEvents(
  userId: string,
  limit: number = 10
): Promise<Array<{
  eventType: AuthEventType;
  result: AuthEventResult;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  failureReason: string | null;
}>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('auth_audit_log')
      .select('event_type, result, ip_address, user_agent, created_at, failure_reason')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      eventType: row.event_type as AuthEventType,
      result: row.result as AuthEventResult,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      failureReason: row.failure_reason,
    }));
  } catch (error) {
    console.error('Failed to fetch auth events:', error);
    return [];
  }
}
