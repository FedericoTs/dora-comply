/**
 * ProblemSection Component
 *
 * Highlights DORA compliance challenges with before/after comparison.
 */

'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const PROBLEM_STATS = [
  { value: '300+', label: 'hours spent', sublabel: 'on manual RoI creation' },
  { value: '15', label: 'ESA templates', sublabel: 'required for submission' },
  { value: '4', label: 'weeks average', sublabel: 'per vendor assessment' },
];

const COMPARISONS = [
  { before: '4+ weeks per vendor assessment', after: '60 seconds per document' },
  { before: 'Manual data entry into spreadsheets', after: 'AI-powered automatic extraction' },
  { before: 'Copy-paste between templates', after: 'Single source of truth' },
  { before: 'Export format nightmares', after: '1-click xBRL-CSV export' },
];

export function ProblemSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section id="problem" ref={ref} className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Problem Stats */}
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            DORA compliance shouldn&apos;t be this hard
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Financial institutions are struggling with the complexity of DORA requirements
          </p>
        </div>

        <div className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700 delay-200",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {PROBLEM_STATS.map((problem, i) => (
            <div
              key={i}
              className="text-center p-8 rounded-2xl bg-slate-50 border"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-5xl font-bold text-primary mb-2">{problem.value}</div>
              <div className="text-lg font-medium mb-1">{problem.label}</div>
              <div className="text-sm text-muted-foreground">{problem.sublabel}</div>
            </div>
          ))}
        </div>

        {/* Before/After Comparison */}
        <div className={cn(
          "max-w-4xl mx-auto transition-all duration-700 delay-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="grid md:grid-cols-2 gap-4 p-6 rounded-2xl border bg-gradient-to-r from-slate-50 to-primary/5">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-semibold text-slate-600">Before DORA Comply</span>
              </div>
              <ul className="space-y-3">
                {COMPARISONS.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    {c.before}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <span className="font-semibold text-success">With DORA Comply</span>
              </div>
              <ul className="space-y-3">
                {COMPARISONS.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {c.after}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
