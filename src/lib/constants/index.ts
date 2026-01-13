/**
 * Constants Module
 *
 * Re-exports all shared constants for easy importing.
 *
 * @example
 * import { FEATURES, STATUS_COLORS, ANIMATION_DELAYS } from '@/lib/constants';
 */

// Marketing content
export {
  FEATURES,
  FEATURE_COLOR_MAP,
  TESTIMONIALS,
  TRUST_INDICATORS,
  PRICING_PLANS,
  getFeatureColorClasses,
  type Feature,
  type FeatureColor,
  type Testimonial,
  type TrustIndicator,
  type PricingPlan,
} from './marketing';

// UI constants
export {
  // Animation
  ANIMATION_DELAYS,
  ANIMATION_DURATIONS,
  LIST_STAGGER_DELAY,
  getStaggerDelay,
  // Status
  STATUS_COLORS,
  getStatusBadgeClasses,
  type StatusType,
  type StatusConfig,
  // Risk
  RISK_COLORS,
  type RiskLevel,
  type RiskConfig,
  // Vendor tiers
  VENDOR_TIER_CONFIG,
  type VendorTier,
  type TierConfig,
  // Documents
  DOCUMENT_TYPE_CONFIG,
  type DocumentType,
  type DocumentTypeConfig,
  // Sizing
  BREAKPOINTS,
  ICON_SIZES,
  AVATAR_SIZES,
} from './ui';
