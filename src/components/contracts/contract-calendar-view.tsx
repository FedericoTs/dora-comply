'use client';

/**
 * Contract Calendar View Component
 * Interactive calendar showing contract events with filtering
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  FileText,
  RefreshCw,
  Bell,
  Eye,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/contracts/queries';

// Event type configuration
const EVENT_TYPE_CONFIG = {
  expiry: {
    label: 'Contract Expiry',
    color: 'bg-error/20 text-error border-error/30',
    dotColor: 'bg-error',
    icon: FileText,
  },
  renewal: {
    label: 'Renewal Due',
    color: 'bg-warning/20 text-warning border-warning/30',
    dotColor: 'bg-warning',
    icon: RefreshCw,
  },
  review: {
    label: 'Review Due',
    color: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    dotColor: 'bg-blue-500',
    icon: Eye,
  },
  alert: {
    label: 'Alert',
    color: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    dotColor: 'bg-orange-500',
    icon: Bell,
  },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function ContractCalendarView() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate date range for the current month view
  const { startDate, endDate, days } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday before the first day
    const start = new Date(firstDay);
    start.setDate(start.getDate() - firstDay.getDay());

    // End on the Saturday after the last day
    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - lastDay.getDay()));

    // Generate all days
    const allDays: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      allDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      days: allDays,
    };
  }, [currentDate]);

  // Fetch calendar events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/contracts/calendar?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch calendar events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (selectedEventType === 'all') return events;
    return events.filter((e) => e.type === selectedEventType);
  }, [events, selectedEventType]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Format date for comparison
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Month navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-48 text-center">
                <h2 className="text-lg font-semibold">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
              </div>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="expiry">Contract Expiries</SelectItem>
                    <SelectItem value="renewal">Renewal Deadlines</SelectItem>
                    <SelectItem value="review">Review Due</SelectItem>
                    <SelectItem value="alert">Alerts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateStr = formatDate(day);
              const dayEvents = eventsByDate[dateStr] || [];
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'min-h-[100px] p-2 rounded-lg border transition-colors cursor-pointer',
                    isCurrentMonth(day) ? 'bg-card' : 'bg-muted/30',
                    isToday(day) && 'border-primary',
                    isSelected && 'ring-2 ring-primary',
                    dayEvents.length > 0 && 'hover:border-primary/50'
                  )}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                >
                  {/* Day number */}
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      !isCurrentMonth(day) && 'text-muted-foreground',
                      isToday(day) &&
                        'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                    )}
                  >
                    {day.getDate()}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const config = EVENT_TYPE_CONFIG[event.type];
                      return (
                        <TooltipProvider key={event.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'text-xs px-1.5 py-0.5 rounded truncate border',
                                  config.color
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/contracts/${event.contractId}`);
                                }}
                              >
                                {event.title}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {event.vendorName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Ref: {event.contractRef}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected date details */}
      {selectedDate && eventsByDate[selectedDate] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Events on {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsByDate[selectedDate].map((event) => {
                const config = EVENT_TYPE_CONFIG[event.type];
                const Icon = config.icon;

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/contracts/${event.contractId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.vendorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.priority && (
                        <Badge
                          variant="outline"
                          className={cn(
                            event.priority === 'critical' && 'bg-error/10 text-error',
                            event.priority === 'high' && 'bg-orange-500/10 text-orange-500',
                            event.priority === 'medium' && 'bg-warning/10 text-warning',
                            event.priority === 'low' && 'bg-blue-500/10 text-blue-500'
                          )}
                        >
                          {event.priority}
                        </Badge>
                      )}
                      <Badge variant="outline">{config.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Legend:</span>
            {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', config.dotColor)} />
                <span className="text-sm">{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
