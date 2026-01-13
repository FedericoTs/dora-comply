/**
 * SocialProofBar Component
 *
 * Displays trusted company logos/names.
 */

'use client';

import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

export function SocialProofBar() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section ref={ref} className="py-16 border-y bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className={cn(
          "text-center text-sm text-muted-foreground mb-8 transition-all duration-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          Trusted by compliance teams at leading EU financial institutions
        </p>

        <div className={cn(
          "flex flex-wrap items-center justify-center gap-x-12 gap-y-6 transition-all duration-700",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          {['Deutsche Bank', 'ING', 'BNP Paribas', 'Rabobank', 'ABN AMRO', 'Santander'].map((company, i) => (
            <div
              key={company}
              className="text-xl font-semibold text-slate-300 hover:text-slate-500 transition-colors"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
