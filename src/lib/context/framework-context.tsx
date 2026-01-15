"use client";

/**
 * Framework Context Provider
 *
 * Provides framework selection state and licensing access throughout the app.
 * Used to:
 * - Track which framework is currently active
 * - Provide enabled frameworks based on license
 * - Check module access in components
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type {
  FrameworkCode,
  FrameworkModule,
  LicenseTier,
  OrganizationLicensing,
} from "@/lib/licensing/types";
import {
  checkFrameworkAccess,
  checkModuleAccess,
  getEnabledModules,
  getUpgradePromptForFramework,
  getUpgradePromptForModule,
} from "@/lib/licensing/check-access";

// ============================================
// CONTEXT TYPES
// ============================================

interface FrameworkContextValue {
  // Current selection
  activeFramework: FrameworkCode;
  setActiveFramework: (framework: FrameworkCode) => void;

  // Licensing info
  licensing: OrganizationLicensing | null;
  licenseTier: LicenseTier;
  enabledFrameworks: FrameworkCode[];

  // Access checks
  hasFrameworkAccess: (framework: FrameworkCode) => boolean;
  hasModuleAccess: (framework: FrameworkCode, module: FrameworkModule) => boolean;
  getModulesForFramework: (framework: FrameworkCode) => FrameworkModule[];

  // Upgrade prompts
  getFrameworkUpgradeInfo: (
    framework: FrameworkCode
  ) => { requiredTier: LicenseTier; features: string[] } | null;
  getModuleUpgradeInfo: (
    framework: FrameworkCode,
    module: FrameworkModule
  ) => { requiredTier: LicenseTier; moduleName: string } | null;

  // Loading state
  isLoading: boolean;
}

// ============================================
// CONTEXT CREATION
// ============================================

const FrameworkContext = createContext<FrameworkContextValue | null>(null);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface FrameworkProviderProps {
  children: ReactNode;
  initialLicensing: OrganizationLicensing | null;
  initialFramework?: FrameworkCode;
}

const STORAGE_KEY = "active-framework";

export function FrameworkProvider({
  children,
  initialLicensing,
  initialFramework,
}: FrameworkProviderProps) {
  const [licensing] = useState<OrganizationLicensing | null>(initialLicensing);
  const [isLoading] = useState(false);

  // Determine default framework from licensing or storage
  const defaultFramework = useMemo<FrameworkCode>(() => {
    if (initialFramework) return initialFramework;

    // Try to get from localStorage on client
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["nis2", "dora", "gdpr", "iso27001"].includes(stored)) {
        // Verify user has access to stored framework
        if (
          licensing &&
          checkFrameworkAccess(licensing, stored as FrameworkCode)
        ) {
          return stored as FrameworkCode;
        }
      }
    }

    // Default to first enabled framework, or nis2
    if (licensing) {
      const enabled = licensing.licensed_frameworks.filter((fw) =>
        checkFrameworkAccess(licensing, fw)
      );
      if (enabled.length > 0) return enabled[0];
    }

    return "nis2";
  }, [initialFramework, licensing]);

  const [activeFramework, setActiveFrameworkState] =
    useState<FrameworkCode>(defaultFramework);

  // Persist framework selection
  const setActiveFramework = useCallback(
    (framework: FrameworkCode) => {
      // Only allow switching to enabled frameworks
      if (licensing && !checkFrameworkAccess(licensing, framework)) {
        return;
      }

      setActiveFrameworkState(framework);

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, framework);
      }
    },
    [licensing]
  );

  // Sync with localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (
        stored &&
        licensing &&
        checkFrameworkAccess(licensing, stored as FrameworkCode)
      ) {
        setActiveFrameworkState(stored as FrameworkCode);
      }
    }
  }, [licensing]);

  // Computed values
  const licenseTier = licensing?.license_tier || "starter";

  const enabledFrameworks = useMemo<FrameworkCode[]>(() => {
    if (!licensing) return ["nis2"];
    return licensing.licensed_frameworks.filter((fw) =>
      checkFrameworkAccess(licensing, fw)
    );
  }, [licensing]);

  // Access check functions
  const hasFrameworkAccessFn = useCallback(
    (framework: FrameworkCode): boolean => {
      if (!licensing) return framework === "nis2"; // Default starter access
      return checkFrameworkAccess(licensing, framework);
    },
    [licensing]
  );

  const hasModuleAccessFn = useCallback(
    (framework: FrameworkCode, module: FrameworkModule): boolean => {
      if (!licensing) return false;
      return checkModuleAccess(licensing, framework, module);
    },
    [licensing]
  );

  const getModulesForFramework = useCallback(
    (framework: FrameworkCode): FrameworkModule[] => {
      if (!licensing) return ["dashboard", "scoring", "gaps", "reports"];
      return getEnabledModules(licensing, framework);
    },
    [licensing]
  );

  // Upgrade info functions
  const getFrameworkUpgradeInfo = useCallback(
    (
      framework: FrameworkCode
    ): { requiredTier: LicenseTier; features: string[] } | null => {
      if (!licensing) return null;
      return getUpgradePromptForFramework(licensing, framework);
    },
    [licensing]
  );

  const getModuleUpgradeInfo = useCallback(
    (
      framework: FrameworkCode,
      module: FrameworkModule
    ): { requiredTier: LicenseTier; moduleName: string } | null => {
      if (!licensing) return null;
      return getUpgradePromptForModule(licensing, framework, module);
    },
    [licensing]
  );

  // Context value
  const value = useMemo<FrameworkContextValue>(
    () => ({
      activeFramework,
      setActiveFramework,
      licensing,
      licenseTier,
      enabledFrameworks,
      hasFrameworkAccess: hasFrameworkAccessFn,
      hasModuleAccess: hasModuleAccessFn,
      getModulesForFramework,
      getFrameworkUpgradeInfo,
      getModuleUpgradeInfo,
      isLoading,
    }),
    [
      activeFramework,
      setActiveFramework,
      licensing,
      licenseTier,
      enabledFrameworks,
      hasFrameworkAccessFn,
      hasModuleAccessFn,
      getModulesForFramework,
      getFrameworkUpgradeInfo,
      getModuleUpgradeInfo,
      isLoading,
    ]
  );

  return (
    <FrameworkContext.Provider value={value}>
      {children}
    </FrameworkContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useFramework(): FrameworkContextValue {
  const context = useContext(FrameworkContext);

  if (!context) {
    throw new Error("useFramework must be used within a FrameworkProvider");
  }

  return context;
}

// ============================================
// OPTIONAL: HOOK FOR CHECKING SPECIFIC ACCESS
// ============================================

/**
 * Hook to check if user has access to a specific framework
 */
export function useFrameworkAccess(framework: FrameworkCode): {
  hasAccess: boolean;
  upgradeInfo: { requiredTier: LicenseTier; features: string[] } | null;
} {
  const { hasFrameworkAccess, getFrameworkUpgradeInfo } = useFramework();

  return {
    hasAccess: hasFrameworkAccess(framework),
    upgradeInfo: getFrameworkUpgradeInfo(framework),
  };
}

/**
 * Hook to check if user has access to a specific module
 */
export function useModuleAccess(
  framework: FrameworkCode,
  module: FrameworkModule
): {
  hasAccess: boolean;
  upgradeInfo: { requiredTier: LicenseTier; moduleName: string } | null;
} {
  const { hasModuleAccess, getModuleUpgradeInfo } = useFramework();

  return {
    hasAccess: hasModuleAccess(framework, module),
    upgradeInfo: getModuleUpgradeInfo(framework, module),
  };
}
