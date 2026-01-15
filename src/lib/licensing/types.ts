/**
 * Framework Licensing Types
 *
 * Defines the type system for modular framework access control.
 * Supports tiered licensing (Starter/Professional/Enterprise) with
 * framework-specific module access.
 */

// ============================================
// FRAMEWORK CODES
// ============================================

export type FrameworkCode = "dora" | "nis2" | "gdpr" | "iso27001";

export const FRAMEWORK_CODES = ["dora", "nis2", "gdpr", "iso27001"] as const;

export const FRAMEWORK_DISPLAY_NAMES: Record<FrameworkCode, string> = {
  nis2: "NIS2",
  dora: "DORA",
  gdpr: "GDPR",
  iso27001: "ISO 27001",
};

export const FRAMEWORK_COLORS: Record<FrameworkCode, string> = {
  nis2: "bg-blue-500",
  dora: "bg-emerald-500",
  gdpr: "bg-purple-500",
  iso27001: "bg-orange-500",
};

export const FRAMEWORK_DESCRIPTIONS: Record<FrameworkCode, string> = {
  nis2: "Network and Information Security Directive 2 - EU cybersecurity framework",
  dora: "Digital Operational Resilience Act - EU financial sector resilience",
  gdpr: "General Data Protection Regulation - EU data privacy framework",
  iso27001: "ISO/IEC 27001 - International information security standard",
};

// ============================================
// LICENSE TIERS
// ============================================

export type LicenseTier = "starter" | "professional" | "enterprise" | "trial";

export const LICENSE_TIERS: LicenseTier[] = [
  "starter",
  "professional",
  "enterprise",
  "trial",
];

export const TIER_DISPLAY_NAMES: Record<LicenseTier, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
  trial: "Trial",
};

export const TIER_FRAMEWORKS: Record<LicenseTier, FrameworkCode[]> = {
  starter: ["nis2"],
  professional: ["nis2", "dora"],
  enterprise: ["nis2", "dora", "gdpr", "iso27001"],
  trial: ["nis2", "dora", "gdpr", "iso27001"], // Full access during trial
};

// ============================================
// FRAMEWORK MODULES
// ============================================

export type FrameworkModule =
  | "dashboard" // Framework-specific dashboard
  | "scoring" // Compliance scoring
  | "gaps" // Gap analysis
  | "roi" // Register of Information (DORA)
  | "incidents" // Incident reporting
  | "testing" // Resilience testing (DORA TLPT)
  | "tprm" // Third party risk management
  | "dpia" // Data Protection Impact Assessment (GDPR)
  | "breach" // Breach management (GDPR)
  | "consent" // Consent management (GDPR)
  | "soa" // Statement of Applicability (ISO)
  | "audit" // Audit preparation (ISO)
  | "reports"; // Compliance reports

export const FRAMEWORK_MODULE_NAMES: Record<FrameworkModule, string> = {
  dashboard: "Dashboard",
  scoring: "Compliance Scoring",
  gaps: "Gap Analysis",
  roi: "Register of Information",
  incidents: "Incident Reporting",
  testing: "Resilience Testing",
  tprm: "Third Party Risk",
  dpia: "DPIA Tool",
  breach: "Breach Management",
  consent: "Consent Management",
  soa: "Statement of Applicability",
  audit: "Audit Preparation",
  reports: "Compliance Reports",
};

// Modules available per framework
export const FRAMEWORK_MODULES: Record<FrameworkCode, FrameworkModule[]> = {
  nis2: ["dashboard", "scoring", "gaps", "incidents", "reports"],
  dora: [
    "dashboard",
    "scoring",
    "gaps",
    "roi",
    "incidents",
    "testing",
    "tprm",
    "reports",
  ],
  gdpr: ["dashboard", "scoring", "gaps", "dpia", "breach", "consent", "reports"],
  iso27001: ["dashboard", "scoring", "gaps", "soa", "audit", "reports"],
};

// Premium modules that require higher tiers
export const PREMIUM_MODULES: Record<FrameworkCode, FrameworkModule[]> = {
  nis2: ["incidents"],
  dora: ["roi", "incidents", "testing", "tprm"],
  gdpr: ["dpia", "breach", "consent"],
  iso27001: ["soa", "audit"],
};

// Base modules available on all tiers
export const BASE_MODULES: FrameworkModule[] = [
  "dashboard",
  "scoring",
  "gaps",
  "reports",
];

// ============================================
// BILLING STATUS
// ============================================

export type BillingStatus = "active" | "past_due" | "canceled" | "trialing";

// ============================================
// ORGANIZATION FRAMEWORK ENTITLEMENT
// ============================================

export interface ModulesEnabled {
  dashboard?: boolean;
  scoring?: boolean;
  gaps?: boolean;
  roi?: boolean;
  incidents?: boolean;
  testing?: boolean;
  tprm?: boolean;
  dpia?: boolean;
  breach?: boolean;
  consent?: boolean;
  soa?: boolean;
  audit?: boolean;
  reports?: boolean;
}

export interface FrameworkEntitlement {
  id: string;
  organization_id: string;
  framework: FrameworkCode;
  enabled: boolean;
  activated_at: string;
  expires_at?: string | null;
  modules_enabled: ModulesEnabled;
  created_at: string;
  updated_at: string;
}

// ============================================
// ORGANIZATION LICENSING
// ============================================

export interface OrganizationLicensing {
  license_tier: LicenseTier;
  licensed_frameworks: FrameworkCode[];
  trial_ends_at?: string | null;
  billing_status: BillingStatus;
  entitlements: Record<FrameworkCode, FrameworkEntitlement>;
}

// ============================================
// FRAMEWORK MODULE DEFINITION (from seed data)
// ============================================

export interface FrameworkModuleDefinition {
  id: string;
  framework: FrameworkCode;
  module_code: FrameworkModule;
  module_name: string;
  description?: string;
  min_tier: LicenseTier;
  is_premium: boolean;
}

// ============================================
// UPGRADE PROMPT DATA
// ============================================

export interface UpgradePromptData {
  currentTier: LicenseTier;
  requiredTier: LicenseTier;
  framework: FrameworkCode;
  module?: FrameworkModule;
  features: string[];
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isValidFramework(value: string): value is FrameworkCode {
  return FRAMEWORK_CODES.includes(value as FrameworkCode);
}

export function isValidTier(value: string): value is LicenseTier {
  return LICENSE_TIERS.includes(value as LicenseTier);
}

export function isValidModule(value: string): value is FrameworkModule {
  return Object.keys(FRAMEWORK_MODULE_NAMES).includes(value);
}

// ============================================
// TIER COMPARISON
// ============================================

const TIER_ORDER: Record<LicenseTier, number> = {
  trial: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function tierMeetsRequirement(
  currentTier: LicenseTier,
  requiredTier: LicenseTier
): boolean {
  // Trial has full access
  if (currentTier === "trial") return true;
  return TIER_ORDER[currentTier] >= TIER_ORDER[requiredTier];
}

export function getRequiredTierForFramework(
  framework: FrameworkCode
): LicenseTier {
  switch (framework) {
    case "nis2":
      return "starter";
    case "dora":
      return "professional";
    case "gdpr":
    case "iso27001":
      return "enterprise";
    default:
      return "enterprise";
  }
}

export function getRequiredTierForModule(
  framework: FrameworkCode,
  module: FrameworkModule
): LicenseTier {
  // Base modules are available at framework's base tier
  if (BASE_MODULES.includes(module)) {
    return getRequiredTierForFramework(framework);
  }

  // Premium modules require at least professional tier
  if (PREMIUM_MODULES[framework]?.includes(module)) {
    const frameworkTier = getRequiredTierForFramework(framework);
    return frameworkTier === "starter" ? "professional" : frameworkTier;
  }

  return getRequiredTierForFramework(framework);
}
