/**
 * FinalCTA Component
 *
 * Bottom-of-page call to action section.
 */

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

export function FinalCTA() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-foreground via-foreground to-slate-800 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className={cn(
          "transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to simplify your
            <br />
            <span className="text-primary">DORA compliance?</span>
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join leading EU financial institutions already using DORA Comply.
            Start your free trial today and generate your first RoI in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                Request Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-600 text-white hover:bg-slate-800">
                Talk to Sales
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-400 mt-6">
            No credit card required. 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
