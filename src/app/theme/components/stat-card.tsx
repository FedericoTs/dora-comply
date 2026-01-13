"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  period?: string;
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  period,
  subtitle,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-label mb-2">{label}</p>
      <p className="stat-value">{value}</p>
      {change && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-success" />
          )}
          <span className="text-sm text-success font-medium">{change}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
      )}
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}
