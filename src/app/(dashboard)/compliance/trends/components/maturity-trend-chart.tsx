'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MaturitySnapshot } from '@/lib/compliance/maturity-history-types';

interface MaturityTrendChartProps {
  snapshots: MaturitySnapshot[];
  timeRange: number;
}

const MATURITY_COLORS = {
  overall: '#3B82F6', // Blue
  ict_risk_mgmt: '#10B981', // Emerald
  incident_reporting: '#F59E0B', // Amber
  resilience_testing: '#8B5CF6', // Violet
  third_party_risk: '#EC4899', // Pink
  info_sharing: '#06B6D4', // Cyan
};

const PILLAR_LABELS: Record<string, string> = {
  overall: 'Overall',
  ict_risk_mgmt: 'ICT Risk',
  incident_reporting: 'Incidents',
  resilience_testing: 'Resilience',
  third_party_risk: '3rd Party',
  info_sharing: 'Info Sharing',
};

export function MaturityTrendChart({ snapshots, timeRange }: MaturityTrendChartProps) {
  const chartData = useMemo(() => {
    // Filter snapshots within time range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    const filteredSnapshots = snapshots
      .filter((s) => new Date(s.snapshot_date) >= cutoffDate)
      .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());

    return filteredSnapshots.map((snapshot) => ({
      date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: snapshot.snapshot_date,
      overall: snapshot.overall_maturity_level,
      ict_risk_mgmt: snapshot.pillar_ict_risk_mgmt,
      incident_reporting: snapshot.pillar_incident_reporting,
      resilience_testing: snapshot.pillar_resilience_testing,
      third_party_risk: snapshot.pillar_third_party_risk,
      info_sharing: snapshot.pillar_info_sharing,
      percent: snapshot.overall_readiness_percent,
    }));
  }, [snapshots, timeRange]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
        <p className="text-lg font-medium">No snapshots yet</p>
        <p className="text-sm mt-1">Take your first snapshot to start tracking trends</p>
      </div>
    );
  }

  if (chartData.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
        <p className="text-lg font-medium">One snapshot recorded</p>
        <p className="text-sm mt-1">Take more snapshots to see trend visualization</p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">L{chartData[0].overall}</div>
            <div className="text-xs">Overall</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{chartData[0].percent.toFixed(0)}%</div>
            <div className="text-xs">Readiness</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">{chartData[0].date}</div>
            <div className="text-xs">Snapshot Date</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 4]}
          ticks={[0, 1, 2, 3, 4]}
          tickFormatter={(value) => `L${value}`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;

            return (
              <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                <p className="font-medium mb-2">{label}</p>
                <div className="space-y-1">
                  {payload.map((entry) => (
                    <div
                      key={entry.dataKey}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {PILLAR_LABELS[entry.dataKey as string] || entry.dataKey}
                      </span>
                      <span className="font-medium">L{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
        />
        <Legend
          formatter={(value: string) => PILLAR_LABELS[value] || value}
          iconType="circle"
          iconSize={8}
        />
        {/* Target L3 reference line */}
        <ReferenceLine
          y={3}
          stroke="#10B981"
          strokeDasharray="5 5"
          label={{
            value: 'L3 Target',
            position: 'right',
            fill: '#10B981',
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="overall"
          stroke={MATURITY_COLORS.overall}
          strokeWidth={3}
          dot={{ r: 4, fill: MATURITY_COLORS.overall }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="ict_risk_mgmt"
          stroke={MATURITY_COLORS.ict_risk_mgmt}
          strokeWidth={2}
          dot={{ r: 3 }}
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="incident_reporting"
          stroke={MATURITY_COLORS.incident_reporting}
          strokeWidth={2}
          dot={{ r: 3 }}
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="resilience_testing"
          stroke={MATURITY_COLORS.resilience_testing}
          strokeWidth={2}
          dot={{ r: 3 }}
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="third_party_risk"
          stroke={MATURITY_COLORS.third_party_risk}
          strokeWidth={2}
          dot={{ r: 3 }}
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="info_sharing"
          stroke={MATURITY_COLORS.info_sharing}
          strokeWidth={2}
          dot={{ r: 3 }}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
