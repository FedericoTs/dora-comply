/**
 * Contract Calendar Page
 * Visual calendar showing contract expiry dates, renewals, reviews, and alerts
 */

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractCalendarView } from '@/components/contracts/contract-calendar-view';

export const metadata = {
  title: 'Contract Calendar | Contracts',
  description: 'View contract deadlines, renewals, and alerts on a calendar',
};

export default function ContractCalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contract Calendar</h1>
        <p className="text-muted-foreground">
          View upcoming contract expirations, renewals, reviews, and alerts
        </p>
      </div>

      {/* Calendar */}
      <Suspense fallback={<CalendarSkeleton />}>
        <ContractCalendarView />
      </Suspense>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
