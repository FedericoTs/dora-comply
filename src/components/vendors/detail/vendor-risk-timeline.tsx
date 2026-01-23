'use client';

/**
 * Vendor Risk Timeline Component
 *
 * Shows vendor score history graph and key events timeline
 * with date range filtering.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  FileCheck,
  Activity,
  Calendar,
  Loader2,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, subDays } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

interface ScoreHistoryPoint {
  id: string;
  score: number;
  grade: string | null;
  provider: string | null;
  factors: Record<string, unknown> | null;
  recorded_at: string;
}

interface TimelineEvent {
  id: string;
  type: 'score_change' | 'document' | 'assessment' | 'incident' | 'contract' | 'activity';
  title: string;
  description: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface VendorRiskTimelineProps {
  vendorId: string;
  vendorName: string;
  currentScore?: number | null;
  currentGrade?: string | null;
}

// ============================================================================
// Date Range Options
// ============================================================================

const DATE_RANGE_OPTIONS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
];

// ============================================================================
// Event Type Configuration
// ============================================================================

const EVENT_CONFIG: Record<TimelineEvent['type'], {
  icon: typeof Activity;
  iconClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  score_change: {
    icon: TrendingUp,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
  },
  document: {
    icon: FileText,
    iconClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/20',
  },
  assessment: {
    icon: FileCheck,
    iconClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/20',
  },
  incident: {
    icon: AlertTriangle,
    iconClass: 'text-error',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/20',
  },
  contract: {
    icon: FileText,
    iconClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/20',
  },
  activity: {
    icon: Activity,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-muted',
  },
};

// ============================================================================
// Score Chart Component (SVG-based)
// ============================================================================

function ScoreChart({
  data,
  height = 120,
}: {
  data: ScoreHistoryPoint[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No score history available
      </div>
    );
  }

  const width = 500;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max scores
  const scores = data.map((d) => d.score);
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 100);
  const scoreRange = maxScore - minScore || 1;

  // Generate path
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.score - minScore) / scoreRange) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${
    padding.top + chartHeight
  } L ${padding.left} ${padding.top + chartHeight} Z`;

  // Score trend
  const firstScore = data[0]?.score || 0;
  const lastScore = data[data.length - 1]?.score || 0;
  const trend = lastScore - firstScore;

  return (
    <div className="relative">
      {/* Trend indicator */}
      <div className="absolute top-0 right-0 flex items-center gap-1 text-xs">
        {trend !== 0 && (
          <>
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-error" />
            )}
            <span className={cn('font-medium', trend > 0 ? 'text-success' : 'text-error')}>
              {trend > 0 ? '+' : ''}{trend} pts
            </span>
          </>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((score) => {
          const y =
            padding.top + chartHeight - ((score - minScore) / scoreRange) * chartHeight;
          return (
            <g key={score}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {score}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#scoreGradient)" opacity={0.2} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          >
            <title>
              {format(new Date(p.recorded_at), 'MMM d, yyyy')}: {p.score}
              {p.grade ? ` (${p.grade})` : ''}
            </title>
          </circle>
        ))}

        {/* Date labels */}
        {data.length > 1 && (
          <>
            <text
              x={padding.left}
              y={height - 8}
              textAnchor="start"
              className="fill-muted-foreground text-[10px]"
            >
              {format(new Date(data[0].recorded_at), 'MMM d')}
            </text>
            <text
              x={width - padding.right}
              y={height - 8}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {format(new Date(data[data.length - 1].recorded_at), 'MMM d')}
            </text>
          </>
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VendorRiskTimeline({
  vendorId,
  vendorName,
  currentScore,
  currentGrade,
}: VendorRiskTimelineProps) {
  const [dateRange, setDateRange] = useState('90');
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryPoint[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Fetch data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const daysBack = parseInt(dateRange, 10);

      // Fetch score history and events via API
      const [historyRes, eventsRes] = await Promise.all([
        fetch(`/api/vendors/${vendorId}/score-history?days=${daysBack}`),
        fetch(`/api/vendors/${vendorId}/timeline-events?days=${daysBack}`),
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setScoreHistory(historyData.data || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data || []);
      }
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayedEvents = showAllEvents ? events : events.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Risk Timeline</h3>
          <p className="text-sm text-muted-foreground">
            Score history and key events for {vendorName}
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Score History Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Risk Score History</CardTitle>
                {currentScore != null && (
                  <Badge variant="outline" className="font-mono">
                    Current: {currentScore}
                    {currentGrade ? ` (${currentGrade})` : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScoreChart data={scoreHistory} height={140} />
            </CardContent>
          </Card>

          {/* Timeline Events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No events in this period</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-7 top-0 bottom-0 w-px bg-border" />

                  {/* Events */}
                  <div className="divide-y">
                    {displayedEvents.map((event, index) => {
                      const config = EVENT_CONFIG[event.type];
                      const Icon = config.icon;

                      return (
                        <div
                          key={event.id}
                          className="relative flex gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          {/* Icon */}
                          <div
                            className={cn(
                              'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border',
                              config.bgClass,
                              config.borderClass
                            )}
                          >
                            <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium leading-none">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {event.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/70">
                              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                              <span className="mx-1">·</span>
                              {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>

                          {/* Link indicator for actionable events */}
                          {(event.type === 'document' || event.type === 'incident') && (
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Show more button */}
                  {events.length > 5 && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => setShowAllEvents(!showAllEvents)}
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            showAllEvents && 'rotate-180'
                          )}
                        />
                        {showAllEvents ? 'Show less' : `Show ${events.length - 5} more`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
