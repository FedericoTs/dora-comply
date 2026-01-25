'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface ComplianceTrendChartProps {
  title?: string | null;
  config: WidgetConfig;
}

interface TrendDataPoint {
  date: string;
  score: number;
}

export function ComplianceTrendChart({ title, config }: ComplianceTrendChartProps) {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const dateRange = config.dateRange || 'month';

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/compliance-trend?range=${dateRange}`);
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
        <TrendingUp className="h-8 w-8 mb-2" />
        <p className="text-sm">No compliance trend data</p>
      </div>
    );
  }

  const latestScore = data[data.length - 1]?.score ?? 0;
  const previousScore = data[data.length - 2]?.score ?? latestScore;
  const trend = latestScore - previousScore;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">{title || 'Compliance Trend'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{latestScore}%</span>
          {trend !== 0 && (
            <span
              className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="font-bold text-primary">{payload[0].value}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
