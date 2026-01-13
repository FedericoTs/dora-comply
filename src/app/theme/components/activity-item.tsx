"use client";

import { CheckCircle2, AlertCircle, FileText } from "lucide-react";

export type ActivityType = "success" | "warning" | "info";

export interface ActivityItemProps {
  title: string;
  vendor: string;
  time: string;
  type: ActivityType;
}

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  info: FileText,
} as const;

const colors = {
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
} as const;

export function ActivityItem({ title, vendor, time, type }: ActivityItemProps) {
  const Icon = icons[type];

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className={`${colors[type]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{vendor}</p>
      </div>
      <p className="text-sm text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}
