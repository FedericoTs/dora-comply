"use client";

/**
 * Locked Module Component
 *
 * Displays an upgrade prompt when users try to access a module
 * they don't have access to.
 */

import Link from "next/link";
import { Lock, Check, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FrameworkCode, LicenseTier } from "@/lib/licensing/types";
import {
  FRAMEWORK_DISPLAY_NAMES,
  FRAMEWORK_COLORS,
  TIER_DISPLAY_NAMES,
} from "@/lib/licensing/types";

// ============================================================================
// Types
// ============================================================================

interface LockedModuleProps {
  /** Framework this module belongs to */
  framework: FrameworkCode;
  /** Display name of the locked module */
  moduleName: string;
  /** List of features included in this module */
  features: string[];
  /** Tier required to unlock this module */
  upgradeTier: LicenseTier;
  /** Optional description text */
  description?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Feature Configurations
// ============================================================================

const TIER_PRICING: Record<LicenseTier, string> = {
  starter: "€299/mo",
  professional: "€999/mo",
  enterprise: "Custom",
  trial: "Free",
};

// ============================================================================
// Component
// ============================================================================

export function LockedModule({
  framework,
  moduleName,
  features,
  upgradeTier,
  description,
  compact = false,
  className,
}: LockedModuleProps) {
  const frameworkName = FRAMEWORK_DISPLAY_NAMES[framework];
  const tierName = TIER_DISPLAY_NAMES[upgradeTier];
  const frameworkColor = FRAMEWORK_COLORS[framework];

  if (compact) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{moduleName}</p>
            <p className="text-xs text-muted-foreground">
              Upgrade to {tierName} to unlock
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/settings/billing">
              Upgrade
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[60vh]", className)}>
      <Card className="max-w-md text-center overflow-hidden">
        {/* Colored header strip */}
        <div className={cn("h-1", frameworkColor)} />

        <CardContent className="p-8">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold mb-2">
            {moduleName}
          </h2>

          {/* Framework Badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs font-medium mb-4">
            <span className={cn("w-2 h-2 rounded-full", frameworkColor)} />
            {frameworkName}
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {description ||
              `Upgrade to ${tierName} to unlock this module and gain access to advanced ${frameworkName} compliance features.`}
          </p>

          {/* Features List */}
          <ul className="text-left space-y-3 mb-6">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/settings/billing">
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to {tierName}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <p className="text-xs text-muted-foreground">
              Starting at {TIER_PRICING[upgradeTier]}
              {upgradeTier === "enterprise" && " • Contact sales for custom pricing"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Variant: Locked Framework (entire framework locked)
// ============================================================================

interface LockedFrameworkProps {
  framework: FrameworkCode;
  features: string[];
  upgradeTier: LicenseTier;
  className?: string;
}

export function LockedFramework({
  framework,
  features,
  upgradeTier,
  className,
}: LockedFrameworkProps) {
  const frameworkName = FRAMEWORK_DISPLAY_NAMES[framework];

  return (
    <LockedModule
      framework={framework}
      moduleName={`${frameworkName} Compliance`}
      features={features}
      upgradeTier={upgradeTier}
      description={`Unlock the complete ${frameworkName} compliance module to assess, track, and report on your organization's ${frameworkName} readiness.`}
      className={className}
    />
  );
}

// ============================================================================
// Variant: Inline Upgrade Banner
// ============================================================================

interface UpgradeBannerProps {
  framework: FrameworkCode;
  moduleName: string;
  upgradeTier: LicenseTier;
  className?: string;
}

export function UpgradeBanner({
  moduleName,
  upgradeTier,
  className,
}: UpgradeBannerProps) {
  const tierName = TIER_DISPLAY_NAMES[upgradeTier];

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed p-4",
        "bg-gradient-to-r from-muted/50 to-transparent",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/5"
          )}
        >
          <Lock className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1">
          <p className="font-medium text-sm">
            {moduleName} requires {tierName}
          </p>
          <p className="text-xs text-muted-foreground">
            Upgrade your plan to access this feature
          </p>
        </div>

        <Button asChild size="sm">
          <Link href="/settings/billing">
            Upgrade
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Index Export
// ============================================================================

export { type LockedModuleProps, type LockedFrameworkProps, type UpgradeBannerProps };
