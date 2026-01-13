"use client";

import type { LucideIcon } from "lucide-react";

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  count?: number;
  badge?: string;
}

export function NavItem({
  icon: Icon,
  label,
  active = false,
  count,
  badge,
}: NavItemProps) {
  return (
    <div className={`nav-item ${active ? "active" : ""}`}>
      <Icon className="h-5 w-5" />
      <span className="flex-1 text-sm">{label}</span>
      {count && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
      {badge && (
        <span className="text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}
