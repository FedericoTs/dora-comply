/**
 * Server-Side License Access Check Utilities
 *
 * Server-only functions to check framework and module access
 * by fetching from the database.
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
import { checkFrameworkAccess, checkModuleAccess } from "./check-access";

// ============================================
// DEFAULT LICENSING (for development/demo)
// ============================================

const DEFAULT_LICENSING: OrganizationLicensing = {
  license_tier: "professional",
  licensed_frameworks: ["nis2", "dora"],
  trial_ends_at: null,
  billing_status: "active",
  entitlements: {
    nis2: {
      id: "default-nis2",
      organization_id: "",
      framework: "nis2",
      enabled: true,
      activated_at: new Date().toISOString(),
      expires_at: null,
      modules_enabled: {
        dashboard: true,
        scoring: true,
        gaps: true,
        reports: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dora: {
      id: "default-dora",
      organization_id: "",
      framework: "dora",
      enabled: true,
      activated_at: new Date().toISOString(),
      expires_at: null,
      modules_enabled: {
        dashboard: true,
        scoring: true,
        gaps: true,
        roi: true,
        incidents: true,
        testing: true,
        tprm: true,
        reports: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  } as Record<FrameworkCode, FrameworkEntitlement>,
};

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
 * Fetches the full licensing context for an organization.
 * Returns default licensing if database columns don't exist yet.
 */
export async function getOrganizationLicensing(
  organizationId: string
): Promise<OrganizationLicensing> {
  try {
    const supabase = await createClient();

    // Fetch organization licensing data
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, license_tier, licensed_frameworks, trial_ends_at, billing_status")
      .eq("id", organizationId)
      .single();

    // If error or missing licensing columns, use defaults
    if (orgError || !org) {
      console.log("Licensing columns not available, using defaults");
      return DEFAULT_LICENSING;
    }

    const orgData = org as unknown as OrganizationRow;

    // Check if licensing columns actually exist (not null)
    if (!orgData.license_tier && !orgData.licensed_frameworks) {
      console.log("Licensing not configured, using defaults");
      return DEFAULT_LICENSING;
    }

    // Fetch entitlements (may not exist yet)
    const { data: entitlements } = await supabase
      .from("organization_framework_entitlements")
      .select("*")
      .eq("organization_id", organizationId);

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

    // Use defaults for missing framework entitlements
    const licensedFrameworks = orgData.licensed_frameworks || ["nis2", "dora"];
    for (const fw of licensedFrameworks) {
      if (!entitlementsMap[fw] && DEFAULT_LICENSING.entitlements[fw]) {
        entitlementsMap[fw] = {
          ...DEFAULT_LICENSING.entitlements[fw],
          organization_id: organizationId,
        };
      }
    }

    return {
      license_tier: orgData.license_tier || "professional",
      licensed_frameworks: licensedFrameworks,
      trial_ends_at: orgData.trial_ends_at,
      billing_status: orgData.billing_status || "active",
      entitlements: entitlementsMap,
    };
  } catch (error) {
    console.error("Error fetching licensing, using defaults:", error);
    return DEFAULT_LICENSING;
  }
}

/**
 * Checks if an organization has access to a framework (server-side)
 */
export async function hasFrameworkAccess(
  organizationId: string,
  framework: FrameworkCode
): Promise<boolean> {
  const licensing = await getOrganizationLicensing(organizationId);
  return checkFrameworkAccess(licensing, framework);
}

/**
 * Checks if an organization has access to a specific module (server-side)
 */
export async function hasModuleAccess(
  organizationId: string,
  framework: FrameworkCode,
  module: FrameworkModule
): Promise<boolean> {
  const licensing = await getOrganizationLicensing(organizationId);
  return checkModuleAccess(licensing, framework, module);
}

/**
 * Get enabled frameworks for an organization (server-side)
 */
export async function getEnabledFrameworks(
  organizationId: string
): Promise<FrameworkCode[]> {
  const licensing = await getOrganizationLicensing(organizationId);
  return licensing.licensed_frameworks.filter((fw) =>
    checkFrameworkAccess(licensing, fw)
  );
}
