'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface VendorTierPieChartProps {
  title?: string | null;
  config: WidgetConfig;
}

interface TierData {
  critical: number;
  important: number;
  standard: number;
  total: number;
}

const COLORS = {
  critical: '#7c3aed', // violet-600
  important: '#3b82f6', // blue-500
  standard: '#6b7280', // gray-500
};

export function VendorTierPieChart({ title, config }: VendorTierPieChartProps) {
  const [data, setData] = useState<TierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/vendors-by-tier');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center animate-pulse">
        <div className="h-32 w-32 rounded-full bg-muted" />
      </div>
    );
  }

  const chartData = data
    ? [
        { name: 'Critical', value: data.critical, color: COLORS.critical },
        { name: 'Important', value: data.important, color: COLORS.important },
        { name: 'Standard', value: data.standard, color: COLORS.standard },
      ].filter((d) => d.value > 0)
    : [];

  const totalVendors = chartData.reduce((sum, d) => sum + d.value, 0);

  if (totalVendors === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <Layers className="h-8 w-8 mb-2" />
        <p className="text-sm">No vendor tier data</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Layers className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Vendor Tier Distribution'}</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-muted-foreground">
                        {data.value} vendors ({((data.value / totalVendors) * 100).toFixed(0)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
