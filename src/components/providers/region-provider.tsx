'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type DataRegion, DEFAULT_REGION, isValidRegion } from '@/lib/supabase/config';

interface RegionContextType {
  region: DataRegion;
  setRegion: (region: DataRegion) => void;
  isLoading: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const REGION_COOKIE_NAME = 'data_region';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<DataRegion>(DEFAULT_REGION);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedRegion = getCookie(REGION_COOKIE_NAME);
    if (savedRegion && isValidRegion(savedRegion)) {
      setRegionState(savedRegion);
    }
    setIsLoading(false);
  }, []);

  const setRegion = (newRegion: DataRegion) => {
    setRegionState(newRegion);
    setCookie(REGION_COOKIE_NAME, newRegion);
  };

  return (
    <RegionContext.Provider value={{ region, setRegion, isLoading }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}
