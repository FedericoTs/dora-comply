/**
 * DeadlineCountdown Component
 *
 * Displays countdown to DORA RoI submission deadline.
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export function DeadlineCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const deadline = new Date('2026-04-30T23:59:59');

    const updateCountdown = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning border border-warning/20">
        <Clock className="h-4 w-4" />
        <span className="font-semibold">{timeLeft.days}</span>
        <span className="text-warning/70">days</span>
      </div>
      <span className="text-muted-foreground text-center sm:text-left">until first RoI submission deadline</span>
    </div>
  );
}
