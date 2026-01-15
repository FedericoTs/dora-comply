"use client";

/**
 * Framework Selector Component
 *
 * Tab-based selector for switching between compliance frameworks.
 * Shows enabled frameworks as active tabs and locked frameworks with lock icon.
 */

import { useFramework } from "@/lib/context/framework-context";
import { cn } from "@/lib/utils";
import { Lock, Plus } from "lucide-react";
import Link from "next/link";
import type { FrameworkCode } from "@/lib/licensing/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// Configuration
// ============================================================================

interface FrameworkConfig {
  code: FrameworkCode;
  name: string;
  color: string;
  description: string;
}

const FRAMEWORKS: FrameworkConfig[] = [
  {
    code: "nis2",
    name: "NIS2",
    color: "bg-blue-500",
    description: "Network & Information Security Directive 2",
  },
  {
    code: "dora",
    name: "DORA",
    color: "bg-emerald-500",
    description: "Digital Operational Resilience Act",
  },
  {
    code: "gdpr",
    name: "GDPR",
    color: "bg-purple-500",
    description: "General Data Protection Regulation",
  },
  {
    code: "iso27001",
    name: "ISO 27001",
    color: "bg-orange-500",
    description: "Information Security Management",
  },
];

// ============================================================================
// Sub-components
// ============================================================================

interface FrameworkTabProps {
  framework: FrameworkConfig;
  isEnabled: boolean;
  isActive: boolean;
  onClick: () => void;
}

function FrameworkTab({
  framework,
  isEnabled,
  isActive,
  onClick,
}: FrameworkTabProps) {
  const button = (
    <button
      onClick={() => isEnabled && onClick()}
      disabled={!isEnabled}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
        "flex items-center gap-1.5",
        isActive && isEnabled && "bg-background shadow-sm",
        !isActive && isEnabled && "hover:bg-background/50",
        !isEnabled && "opacity-50 cursor-not-allowed"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", framework.color)} />
      <span className="hidden sm:inline">{framework.name}</span>
      <span className="sm:hidden">{framework.code.toUpperCase().slice(0, 3)}</span>
      {!isEnabled && <Lock className="w-3 h-3" />}
    </button>
  );

  if (!isEnabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">
              Upgrade to unlock {framework.name}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

// ============================================================================
// Main Component
// ============================================================================

interface FrameworkSelectorProps {
  /** Show all frameworks or only enabled ones */
  showLocked?: boolean;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

export function FrameworkSelector({
  showLocked = true,
  compact = false,
  className,
}: FrameworkSelectorProps) {
  const { activeFramework, enabledFrameworks, setActiveFramework } = useFramework();

  const frameworksToShow = showLocked
    ? FRAMEWORKS
    : FRAMEWORKS.filter((fw) => enabledFrameworks.includes(fw.code));

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-muted rounded-lg p-1",
        compact && "p-0.5",
        className
      )}
    >
      {frameworksToShow.map((fw) => {
        const isEnabled = enabledFrameworks.includes(fw.code);
        const isActive = activeFramework === fw.code;

        return (
          <FrameworkTab
            key={fw.code}
            framework={fw}
            isEnabled={isEnabled}
            isActive={isActive}
            onClick={() => setActiveFramework(fw.code)}
          />
        );
      })}

      {/* Add More Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings/billing"
              className={cn(
                "px-2 py-1.5 text-muted-foreground hover:text-foreground",
                "transition-colors rounded-md hover:bg-background/50"
              )}
            >
              <Plus className="w-4 h-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Add more frameworks</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// Variant: Dropdown (for mobile/compact spaces)
// ============================================================================

export function FrameworkSelectorDropdown({ className }: { className?: string }) {
  const { activeFramework, enabledFrameworks, setActiveFramework } = useFramework();

  const activeConfig = FRAMEWORKS.find((fw) => fw.code === activeFramework);

  return (
    <div className={cn("relative", className)}>
      <select
        value={activeFramework}
        onChange={(e) => {
          const code = e.target.value as FrameworkCode;
          if (enabledFrameworks.includes(code)) {
            setActiveFramework(code);
          }
        }}
        className={cn(
          "appearance-none bg-muted rounded-lg px-3 py-1.5",
          "text-sm font-medium cursor-pointer",
          "border-0 focus:ring-2 focus:ring-primary/20",
          "pr-8"
        )}
      >
        {FRAMEWORKS.map((fw) => {
          const isEnabled = enabledFrameworks.includes(fw.code);
          return (
            <option
              key={fw.code}
              value={fw.code}
              disabled={!isEnabled}
            >
              {fw.name} {!isEnabled ? "(Locked)" : ""}
            </option>
          );
        })}
      </select>

      {/* Color indicator */}
      {activeConfig && (
        <span
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "w-2 h-2 rounded-full pointer-events-none",
            activeConfig.color
          )}
        />
      )}
    </div>
  );
}
