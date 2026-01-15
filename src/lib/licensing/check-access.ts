/**
 * Pure License Access Check Utilities
 *
 * Client-safe functions to check framework and module access
 * based on licensing data. These functions do NOT fetch from
 * the database - they operate on pre-fetched licensing data.
 *
 * For server-side functions that fetch from database,
 * use check-access-server.ts instead.
 */

import type {
  FrameworkCode,
  FrameworkModule,
  LicenseTier,
  OrganizationLicensing,
  ModulesEnabled,
} from "./types";
import {
  TIER_FRAMEWORKS,
  BASE_MODULES,
  tierMeetsRequirement,
  getRequiredTierForFramework,
  getRequiredTierForModule,
} from "./types";

// ============================================
// PURE FUNCTIONS (Can be used client-side)
// ============================================

/**
 * Pure function to check framework access given licensing data
 */
export function checkFrameworkAccess(
  licensing: OrganizationLicensing,
  framework: FrameworkCode
): boolean {
  // Check billing status
  if (licensing.billing_status === "canceled") {
    return false;
  }

  // Check trial expiration
  if (licensing.license_tier === "trial" && licensing.trial_ends_at) {
    const trialEnd = new Date(licensing.trial_ends_at);
    if (trialEnd < new Date()) {
      return false;
    }
  }

  // Check if framework is in licensed list
  if (!licensing.licensed_frameworks.includes(framework)) {
    return false;
  }

  // Check tier meets framework requirement
  const requiredTier = getRequiredTierForFramework(framework);
  if (!tierMeetsRequirement(licensing.license_tier, requiredTier)) {
    return false;
  }

  // Check entitlement if exists
  const entitlement = licensing.entitlements[framework];
  if (entitlement) {
    // Check if entitlement is enabled
    if (!entitlement.enabled) {
      return false;
    }

    // Check if entitlement has expired
    if (entitlement.expires_at) {
      const expiresAt = new Date(entitlement.expires_at);
      if (expiresAt < new Date()) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Pure function to check module access given licensing data
 */
export function checkModuleAccess(
  licensing: OrganizationLicensing,
  framework: FrameworkCode,
  module: FrameworkModule
): boolean {
  // First check framework access
  if (!checkFrameworkAccess(licensing, framework)) {
    return false;
  }

  // Base modules are always available if framework is accessible
  if (BASE_MODULES.includes(module)) {
    return true;
  }

  // Check tier for premium modules
  const requiredTier = getRequiredTierForModule(framework, module);
  if (!tierMeetsRequirement(licensing.license_tier, requiredTier)) {
    return false;
  }

  // Check specific module entitlement
  const entitlement = licensing.entitlements[framework];
  if (entitlement?.modules_enabled) {
    const moduleEnabled = entitlement.modules_enabled[module as keyof ModulesEnabled];
    if (moduleEnabled === false) {
      return false;
    }
  }

  return true;
}

/**
 * Get all enabled modules for a framework
 */
export function getEnabledModules(
  licensing: OrganizationLicensing,
  framework: FrameworkCode
): FrameworkModule[] {
  if (!checkFrameworkAccess(licensing, framework)) {
    return [];
  }

  const entitlement = licensing.entitlements[framework];
  if (!entitlement?.modules_enabled) {
    // Return base modules by default
    return [...BASE_MODULES];
  }

  const enabledModules: FrameworkModule[] = [];
  const modules = Object.entries(entitlement.modules_enabled) as [
    FrameworkModule,
    boolean | undefined
  ][];

  for (const [module, enabled] of modules) {
    if (enabled !== false) {
      // Check if tier supports this module
      const requiredTier = getRequiredTierForModule(framework, module);
      if (tierMeetsRequirement(licensing.license_tier, requiredTier)) {
        enabledModules.push(module);
      }
    }
  }

  return enabledModules;
}

/**
 * Check if organization can upgrade from current tier
 */
export function canUpgradeTo(
  licensing: OrganizationLicensing,
  targetTier: LicenseTier
): boolean {
  const tierOrder = { trial: 0, starter: 1, professional: 2, enterprise: 3 };
  return tierOrder[targetTier] > tierOrder[licensing.license_tier];
}

/**
 * Get frameworks available at a target tier
 */
export function getFrameworksAtTier(tier: LicenseTier): FrameworkCode[] {
  return TIER_FRAMEWORKS[tier];
}

// ============================================
// UTILITY FUNCTIONS FOR UI
// ============================================

/**
 * Get upgrade prompt info for a locked framework
 */
export function getUpgradePromptForFramework(
  licensing: OrganizationLicensing,
  framework: FrameworkCode
): { requiredTier: LicenseTier; features: string[] } | null {
  if (checkFrameworkAccess(licensing, framework)) {
    return null; // Already has access
  }

  const requiredTier = getRequiredTierForFramework(framework);

  const featuresByFramework: Record<FrameworkCode, string[]> = {
    nis2: [
      "NIS2 Compliance Dashboard",
      "Gap Analysis",
      "Compliance Scoring",
      "Compliance Reports",
    ],
    dora: [
      "Register of Information (15 ESA templates)",
      "ICT Incident Reporting",
      "TLPT Testing Management",
      "Concentration Risk Analysis",
    ],
    gdpr: [
      "DPIA Assessment Tool",
      "72h Breach Notification",
      "Consent Management",
      "Data Subject Rights",
    ],
    iso27001: [
      "ISMS Dashboard",
      "Statement of Applicability Generator",
      "Internal Audit Toolkit",
      "Certification Readiness",
    ],
  };

  return {
    requiredTier,
    features: featuresByFramework[framework],
  };
}

/**
 * Get upgrade prompt info for a locked module
 */
export function getUpgradePromptForModule(
  licensing: OrganizationLicensing,
  framework: FrameworkCode,
  module: FrameworkModule
): { requiredTier: LicenseTier; moduleName: string } | null {
  if (checkModuleAccess(licensing, framework, module)) {
    return null; // Already has access
  }

  const requiredTier = getRequiredTierForModule(framework, module);

  const moduleNames: Record<FrameworkModule, string> = {
    dashboard: "Dashboard",
    scoring: "Compliance Scoring",
    gaps: "Gap Analysis",
    roi: "Register of Information",
    incidents: "Incident Reporting",
    testing: "Resilience Testing",
    tprm: "Third Party Risk Management",
    dpia: "DPIA Tool",
    breach: "Breach Management",
    consent: "Consent Management",
    soa: "Statement of Applicability",
    audit: "Audit Preparation",
    reports: "Compliance Reports",
  };

  return {
    requiredTier,
    moduleName: moduleNames[module],
  };
}
