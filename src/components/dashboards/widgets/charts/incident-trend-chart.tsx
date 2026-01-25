'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface IncidentTrendChartProps {
  title?: string | null;
  config: WidgetConfig;
}

interface TrendDataPoint {
  month: string;
  count: number;
}

export function IncidentTrendChart({ title, config }: IncidentTrendChartProps) {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const dateRange = config.dateRange || 'month';

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/incident-trend?range=${dateRange}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center animate-pulse">
        <div className="h-24 w-full bg-muted rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <BarChart2 className="h-8 w-8 mb-2" />
        <p className="text-sm">No incident trend data</p>
      </div>
    );
  }

  const totalIncidents = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart2 className="h-4 w-4" />
          <span className="text-sm font-medium">{title || 'Incident Trend'}</span>
        </div>
        <span className="text-sm text-muted-foreground">{totalIncidents} total</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={25}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="font-bold">{payload[0].value} incidents</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
