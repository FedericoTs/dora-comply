"use client";

export interface ColorSwatchProps {
  name: string;
  color: string;
  value: string;
}

export function ColorSwatch({ name, color, value }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${color}`} />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{value}</p>
      </div>
    </div>
  );
}
