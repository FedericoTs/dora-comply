/**
 * Marketing Content Constants
 *
 * Centralized marketing content for landing pages.
 * Keep content separate from components for easier updates.
 */

import type { LucideIcon } from 'lucide-react';
import {
  FileSearch,
  FileText,
  AlertTriangle,
  Network,
  Building2,
  BarChart3,
} from 'lucide-react';

// ============================================================================
// Feature Types & Data
// ============================================================================

export type FeatureColor = 'primary' | 'info' | 'warning' | 'purple' | 'success' | 'chart-4';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  color: FeatureColor;
}

export const FEATURES: Feature[] = [
  {
    icon: FileSearch,
    title: 'AI Document Parsing',
    description: 'Upload SOC 2, ISO 27001, and pen test reports. Our AI extracts controls, exceptions, and findings in under 60 seconds.',
    badge: 'Core Feature',
    color: 'primary',
  },
  {
    icon: FileText,
    title: 'Register of Information',
    description: 'All 15 ESA-mandated templates auto-populated from your vendor data. Export to xBRL-CSV with one click.',
    badge: 'DORA Art. 28',
    color: 'info',
  },
  {
    icon: AlertTriangle,
    title: 'Incident Reporting',
    description: 'DORA Article 19 compliant workflow with automated deadline tracking: 4-hour, 72-hour, and 30-day reports.',
    badge: 'DORA Art. 19',
    color: 'warning',
  },
  {
    icon: Network,
    title: 'Cross-Framework Mapping',
    description: 'Automatic mapping between DORA, NIS2, GDPR, and ISO 27001. See compliance coverage across all frameworks.',
    badge: 'Multi-Framework',
    color: 'purple',
  },
  {
    icon: Building2,
    title: 'Vendor Management',
    description: 'Complete vendor lifecycle from onboarding to exit. Track criticality, contracts, and risk scores in one place.',
    badge: 'ICT Third Parties',
    color: 'success',
  },
  {
    icon: BarChart3,
    title: 'Risk Dashboard',
    description: 'Real-time risk scoring with trend analysis. Board-ready reports and concentration risk monitoring.',
    badge: 'Analytics',
    color: 'chart-4',
  },
];

// ============================================================================
// Color Mapping
// ============================================================================

/** Tailwind class combinations for feature colors */
export const FEATURE_COLOR_MAP: Record<FeatureColor, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  purple: 'bg-purple-500/10 text-purple-500',
  success: 'bg-success/10 text-success',
  'chart-4': 'bg-violet-500/10 text-violet-500',
};

/** Get color classes for a feature color */
export function getFeatureColorClasses(color: FeatureColor): string {
  return FEATURE_COLOR_MAP[color] ?? FEATURE_COLOR_MAP.primary;
}

// ============================================================================
// Testimonials
// ============================================================================

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  /** Optional avatar URL */
  avatarUrl?: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'DORA Comply reduced our vendor assessment time by 90%. What used to take weeks now takes hours. The AI parsing is remarkably accurate.',
    author: 'Maria van der Berg',
    role: 'Head of Third-Party Risk',
    company: 'Major EU Bank',
    rating: 5,
  },
  {
    quote: 'Finally, a platform that understands EU regulations. The RoI export feature alone saved us 200+ hours of manual work.',
    author: 'Thomas Weber',
    role: 'Chief Compliance Officer',
    company: 'Insurance Group',
    rating: 5,
  },
  {
    quote: 'The cross-framework mapping is invaluable. We can now see our DORA, NIS2, and ISO 27001 compliance in one view.',
    author: 'Sophie Laurent',
    role: 'VP of Risk Management',
    company: 'Investment Firm',
    rating: 5,
  },
];

// ============================================================================
// Trust Indicators / Social Proof
// ============================================================================

export interface TrustIndicator {
  value: string;
  label: string;
}

export const TRUST_INDICATORS: TrustIndicator[] = [
  { value: '€500B+', label: 'Assets managed by clients' },
  { value: '15,000+', label: 'Vendors assessed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: 'SOC 2', label: 'Type II Certified' },
];

// ============================================================================
// Pricing Plans
// ============================================================================

export interface PricingPlan {
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    description: 'For teams getting started with DORA',
    price: { monthly: 499, annual: 399 },
    features: [
      'Up to 50 vendors',
      'AI document parsing (50/month)',
      'Basic RoI templates',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    description: 'For growing compliance teams',
    price: { monthly: 999, annual: 799 },
    features: [
      'Up to 200 vendors',
      'Unlimited AI parsing',
      'Full RoI automation',
      'Incident reporting',
      'API access',
      'Priority support',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    description: 'For large financial institutions',
    price: { monthly: 0, annual: 0 }, // Custom pricing
    features: [
      'Unlimited vendors',
      'Custom AI models',
      'Advanced analytics',
      'SSO & SCIM',
      'Dedicated CSM',
      'SLA guarantees',
    ],
    cta: 'Contact Sales',
  },
];
