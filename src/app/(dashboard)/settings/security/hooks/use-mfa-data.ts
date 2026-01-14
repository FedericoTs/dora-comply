'use client';

/**
 * useMFAData Hook
 *
 * Manages MFA factors and authentication data
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getMFAFactors, unenrollFactor, getAuthenticatorAssuranceLevel } from '@/lib/auth/mfa-actions';
import { getCurrentUser } from '@/lib/auth/actions';
import type { MFAFactor, AuthenticatorAssuranceLevel, UserRole } from '@/lib/auth/types';

export function useMFAData() {
  const [isLoading, setIsLoading] = useState(true);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [aalInfo, setAalInfo] = useState<AuthenticatorAssuranceLevel | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const loadMFAData = useCallback(async () => {
    try {
      const [factorsResult, aalResult, user] = await Promise.all([
        getMFAFactors(),
        getAuthenticatorAssuranceLevel(),
        getCurrentUser(),
      ]);

      if (factorsResult.success && factorsResult.data) {
        // Combine TOTP and phone factors, filter to verified only
        const allFactors = [...factorsResult.data.totp, ...factorsResult.data.phone];
        setFactors(allFactors.filter((f) => f.status === 'verified'));
      }

      if (aalResult.success && aalResult.data) {
        setAalInfo(aalResult.data);
      }

      if (user) {
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Failed to load MFA data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMFAData();
  }, [loadMFAData]);

  const handleDeleteFactor = useCallback(
    async (factorId: string) => {
      try {
        const result = await unenrollFactor(factorId);

        if (result.success) {
          toast.success('Authenticator removed');
          loadMFAData();
          return true;
        } else {
          toast.error(result.error?.message || 'Failed to remove authenticator');
          return false;
        }
      } catch (error) {
        console.error('Failed to remove factor:', error);
        toast.error('Failed to remove authenticator');
        return false;
      }
    },
    [loadMFAData]
  );

  return {
    isLoading,
    factors,
    aalInfo,
    userRole,
    loadMFAData,
    handleDeleteFactor,
    hasMFA: factors.length > 0,
  };
}
