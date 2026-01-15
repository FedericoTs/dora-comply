/**
 * License Access Check Utilities
 *
 * Server and client-side functions to check framework and module access
 * based on organization licensing.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  FrameworkCode,
  FrameworkModule,
  LicenseTier,
  FrameworkEntitlement,
  OrganizationLicensing,
  BillingStatus,
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
// DATABASE TYPES (until supabase types are regenerated)
// ============================================

interface OrganizationRow {
  id: string;
  name: string;
  license_tier: LicenseTier | null;
  licensed_frameworks: FrameworkCode[] | null;
  trial_ends_at: string | null;
  billing_status: BillingStatus | null;
}

interface EntitlementRow {
  id: string;
  organization_id: string;
  framework: FrameworkCode;
  enabled: boolean;
  activated_at: string;
  expires_at: string | null;
  modules_enabled: ModulesEnabled;
  created_at: string;
  updated_at: string;
}

// ============================================
// SERVER-SIDE ACCESS CHECKS
// ============================================

/**
 * Fetches the full licensing context for an organization
 */
export async function getOrganizationLicensing(
  organizationId: string
): Promise<OrganizationLicensing | null> {
  const supabase = await createClient();

  // Fetch organization licensing data
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, license_tier, licensed_frameworks, trial_ends_at, billing_status")
    .eq("id", organizationId)
    .single();

  if (orgError || !org) {
    console.error("Error fetching organization licensing:", orgError);
    return null;
  }

  const orgData = org as unknown as OrganizationRow;

  // Fetch entitlements
  const { data: entitlements, error: entError } = await supabase
    .from("organization_framework_entitlements")
    .select("*")
    .eq("organization_id", organizationId);

  if (entError) {
    console.error("Error fetching entitlements:", entError);
    return null;
  }

  const entitlementRows = (entitlements || []) as unknown as EntitlementRow[];

  // Build entitlements map
  const entitlementsMap: Record<FrameworkCode, FrameworkEntitlement> = {} as Record<
    FrameworkCode,
    FrameworkEntitlement
  >;

  for (const ent of entitlementRows) {
    entitlementsMap[ent.framework] = {
      id: ent.id,
      organization_id: ent.organization_id,
      framework: ent.framework,
      enabled: ent.enabled,
      activated_at: ent.activated_at,
      expires_at: ent.expires_at,
      modules_enabled: ent.modules_enabled,
      created_at: ent.created_at,
      updated_at: ent.updated_at,
    };
  }

  return {
    license_tier: orgData.license_tier || "starter",
    licensed_frameworks: orgData.licensed_frameworks || ["nis2"],
    trial_ends_at: orgData.trial_ends_at,
    billing_status: orgData.billing_status || "active",
    entitlements: entitlementsMap,
  };
}

/**
 * Checks if an organization has access to a framework
 */
export async function hasFrameworkAccess(
  organizationId: string,
  framework: FrameworkCode
): Promise<boolean> {
  const licensing = await getOrganizationLicensing(organizationId);
  if (!licensing) return false;

  return checkFrameworkAccess(licensing, framework);
}

/**
 * Checks if an organization has access to a specific module
 */
export async function hasModuleAccess(
  organizationId: string,
  framework: FrameworkCode,
  module: FrameworkModule
): Promise<boolean> {
  const licensing = await getOrganizationLicensing(organizationId);
  if (!licensing) return false;

  return checkModuleAccess(licensing, framework, module);
}

/**
 * Get enabled frameworks for an organization
 */
export async function getEnabledFrameworks(
  organizationId: string
): Promise<FrameworkCode[]> {
  const licensing = await getOrganizationLicensing(organizationId);
  if (!licensing) return [];

  return licensing.licensed_frameworks.filter((fw) =>
    checkFrameworkAccess(licensing, fw)
  );
}

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
