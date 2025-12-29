'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegion } from '@/components/providers/region-provider';
import { type DataRegion } from '@/lib/supabase/config';

const regions: { value: DataRegion; label: string; flag: string }[] = [
  { value: 'us', label: 'United States', flag: '🇺🇸' },
  { value: 'eu', label: 'European Union', flag: '🇪🇺' },
];

export function RegionSelector() {
  const { region, setRegion, isLoading } = useRegion();

  if (isLoading) {
    return (
      <div className="h-10 w-[180px] animate-pulse rounded-md bg-muted" />
    );
  }

  return (
    <Select value={region} onValueChange={(value) => setRegion(value as DataRegion)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select region" />
      </SelectTrigger>
      <SelectContent>
        {regions.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            <span className="flex items-center gap-2">
              <span>{r.flag}</span>
              <span>{r.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
