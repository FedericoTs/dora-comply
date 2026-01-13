/**
 * StatsSection Component
 *
 * Displays key platform statistics.
 */

'use client';

import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const STATS = [
  { value: '45s', label: 'Average SOC 2 parsing time' },
  { value: '15', label: 'ESA templates supported' },
  { value: '98%', label: 'Customer satisfaction' },
  { value: '4', label: 'Compliance frameworks mapped' },
  { value: '1000+', label: 'Vendors assessed' },
  { value: 'EU', label: 'Data residency guaranteed' },
];

export function StatsSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section ref={ref} className="py-24 bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "text-center transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
