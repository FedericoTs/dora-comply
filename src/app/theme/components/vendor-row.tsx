"use client";

import { ChevronRight } from "lucide-react";

export type PriorityLevel = "High" | "Medium" | "Low";

export interface VendorRowProps {
  name: string;
  type: string;
  priority: PriorityLevel;
  due: string;
}

const priorityStyles: Record<PriorityLevel, string> = {
  High: "badge-error",
  Medium: "badge-warning",
  Low: "badge-default",
};

export function VendorRow({ name, type, priority, due }: VendorRowProps) {
  return (
    <tr className="group cursor-pointer">
      <td>
        <div className="flex items-center gap-3">
          <div className="avatar-primary">
            <span className="text-xs font-semibold">
              {name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
          </div>
          <span className="font-medium">{name}</span>
        </div>
      </td>
      <td className="text-muted-foreground">{type}</td>
      <td>
        <span className={`badge ${priorityStyles[priority]}`}>{priority}</span>
      </td>
      <td className="text-muted-foreground">{due}</td>
      <td>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </td>
    </tr>
  );
}
