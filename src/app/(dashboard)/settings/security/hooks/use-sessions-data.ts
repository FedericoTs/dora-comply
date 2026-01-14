'use client';

/**
 * useSessionsData Hook
 *
 * Manages session loading and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Session } from '../components/types';

export function useSessionsData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const response = await fetch(`/api/settings/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to revoke session');
      }

      toast.success('Session revoked');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Revoke session error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setRevokingAll(true);
    try {
      const response = await fetch('/api/settings/sessions', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to revoke sessions');
      }

      const result = await response.json();
      toast.success(result.message || 'Signed out of other sessions');
      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.is_current);

  return {
    sessions,
    sessionsLoading,
    revokingSessionId,
    revokingAll,
    otherSessions,
    handleRevokeSession,
    handleRevokeAllOther,
  };
}
