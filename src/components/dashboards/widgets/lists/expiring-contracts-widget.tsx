'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileWarning, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface ExpiringContractsWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface Contract {
  id: string;
  vendor_id: string;
  vendor_name: string;
  contract_type: string;
  end_date: string;
  days_until_expiry: number;
}

export function ExpiringContractsWidget({ title, config }: ExpiringContractsWidgetProps) {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = config.limit ?? 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/expiring-contracts?limit=${limit}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.contracts || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const getExpiryBadge = (days: number) => {
    if (days < 0) {
      return { label: 'Expired', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    }
    if (days <= 30) {
      return { label: `${days}d`, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    }
    if (days <= 60) {
      return { label: `${days}d`, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
    }
    return { label: `${days}d`, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileWarning className="h-4 w-4" />
          <span className="text-sm font-medium">{title || 'Expiring Contracts'}</span>
        </div>
        <Link
          href="/contracts"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        {data.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No contracts expiring soon
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((contract) => {
              const badge = getExpiryBadge(contract.days_until_expiry);

              return (
                <Link
                  key={contract.id}
                  href={`/vendors/${contract.vendor_id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contract.vendor_name}</p>
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {contract.contract_type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('text-xs', badge.className)}>
                      {badge.label}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
