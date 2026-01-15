/**
 * Licensing Queries
 *
 * Server-side functions for fetching licensing data.
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/lib/auth/organization";
import type {
  FrameworkCode,
  LicenseTier,
  BillingStatus,
  FrameworkEntitlement,
  OrganizationLicensing,
  ModulesEnabled,
} from "./types";

// ============================================================================
// Default Licensing (for new/demo organizations)
// ============================================================================

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

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches the licensing data for the current user's organization.
 * Returns default licensing if database doesn't have licensing columns yet.
 */
export async function getCurrentOrganizationLicensing(): Promise<OrganizationLicensing> {
  try {
    const organizationId = await getCurrentUserOrganization();
    if (!organizationId) {
      return DEFAULT_LICENSING;
    }

    const supabase = await createClient();

    // Try to fetch organization with licensing columns
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, license_tier, licensed_frameworks, trial_ends_at, billing_status")
      .eq("id", organizationId)
      .single();

    // If columns don't exist or error, return default
    if (orgError || !org) {
      console.log("Licensing columns not yet available, using defaults");
      return DEFAULT_LICENSING;
    }

    // Check if licensing columns exist
    const hasLicensingColumns = "license_tier" in org;
    if (!hasLicensingColumns) {
      return DEFAULT_LICENSING;
    }

    // Fetch entitlements
    const { data: entitlements } = await supabase
      .from("organization_framework_entitlements")
      .select("*")
      .eq("organization_id", organizationId);

    // Build entitlements map
    const entitlementsMap: Record<FrameworkCode, FrameworkEntitlement> = {} as Record<
      FrameworkCode,
      FrameworkEntitlement
    >;

    if (entitlements) {
      for (const ent of entitlements) {
        const framework = ent.framework as FrameworkCode;
        entitlementsMap[framework] = {
          id: ent.id,
          organization_id: ent.organization_id,
          framework,
          enabled: ent.enabled,
          activated_at: ent.activated_at,
          expires_at: ent.expires_at,
          modules_enabled: ent.modules_enabled as ModulesEnabled,
          created_at: ent.created_at,
          updated_at: ent.updated_at,
        };
      }
    }

    // Use defaults for any missing framework entitlements
    const licensedFrameworks = (org.licensed_frameworks as FrameworkCode[]) || ["nis2", "dora"];
    for (const fw of licensedFrameworks) {
      if (!entitlementsMap[fw]) {
        entitlementsMap[fw] = DEFAULT_LICENSING.entitlements[fw] || {
          id: `default-${fw}`,
          organization_id: organizationId,
          framework: fw,
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
        };
      }
    }

    return {
      license_tier: (org.license_tier as LicenseTier) || "professional",
      licensed_frameworks: licensedFrameworks,
      trial_ends_at: org.trial_ends_at as string | null,
      billing_status: (org.billing_status as BillingStatus) || "active",
      entitlements: entitlementsMap,
    };
  } catch (error) {
    console.error("Error fetching licensing:", error);
    return DEFAULT_LICENSING;
  }
}
