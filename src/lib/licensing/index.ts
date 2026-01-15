/**
 * Licensing Module
 *
 * Exports all licensing-related types and utilities for
 * modular framework access control.
 */

// Types
export type {
  FrameworkCode,
  LicenseTier,
  FrameworkModule,
  BillingStatus,
  ModulesEnabled,
  FrameworkEntitlement,
  OrganizationLicensing,
  FrameworkModuleDefinition,
  UpgradePromptData,
} from "./types";

// Constants
export {
  FRAMEWORK_CODES,
  FRAMEWORK_DISPLAY_NAMES,
  FRAMEWORK_COLORS,
  FRAMEWORK_DESCRIPTIONS,
  LICENSE_TIERS,
  TIER_DISPLAY_NAMES,
  TIER_FRAMEWORKS,
  FRAMEWORK_MODULE_NAMES,
  FRAMEWORK_MODULES,
  PREMIUM_MODULES,
  BASE_MODULES,
} from "./types";

// Type guards and utilities
export {
  isValidFramework,
  isValidTier,
  isValidModule,
  tierMeetsRequirement,
  getRequiredTierForFramework,
  getRequiredTierForModule,
} from "./types";

// Server-side access checks (use these in server components/actions)
export {
  getOrganizationLicensing,
  hasFrameworkAccess,
  hasModuleAccess,
  getEnabledFrameworks,
} from "./check-access-server";

// Pure functions (safe for client components)
export {
  checkFrameworkAccess,
  checkModuleAccess,
  getEnabledModules,
  canUpgradeTo,
  getFrameworksAtTier,
  getUpgradePromptForFramework,
  getUpgradePromptForModule,
} from "./check-access";
