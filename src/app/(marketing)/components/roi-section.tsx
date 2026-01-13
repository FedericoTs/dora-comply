/**
 * RoISection Component
 *
 * Feature deep dive for Register of Information generation.
 */

'use client';

import Link from 'next/link';
import {
  FileText,
  Zap,
  CheckCircle2,
  FileCheck,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const TEMPLATES = [
  'B_01.01 - Entity Identification',
  'B_02.01 - ICT Providers',
  'B_03.01 - Contracts',
  'B_04.01 - ICT Services',
  'B_05.01 - Critical Functions',
  'B_06.01 - Subcontracting',
];

const BENEFITS = [
  { icon: Zap, text: 'Auto-populated from parsed documents' },
  { icon: CheckCircle2, text: 'Built-in validation against ESA rules' },
  { icon: FileCheck, text: 'One-click xBRL-CSV export' },
  { icon: GitBranch, text: 'Version control and audit trail' },
];

export function RoISection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-slate-50/50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Visual */}
          <div className={cn(
            "relative order-2 lg:order-1 transition-all duration-700",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          )}>
            <div className="relative">
              {/* Stacked Templates */}
              <div className="space-y-3">
                {TEMPLATES.map((template, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                    style={{
                      marginLeft: `${i * 8}px`,
                      opacity: 1 - (i * 0.1),
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{template}</div>
                        <div className="text-xs text-muted-foreground">Auto-populated</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-xs">Ready</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* More indicator */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                + 9 more templates included
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={cn(
            "order-1 lg:order-2 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          )}>
            <Badge variant="secondary" className="mb-4">DORA Article 28</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Register of Information in One Click
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              All 15 ESA-mandated templates automatically populated from your vendor data.
              No manual copy-paste. No format errors. Export-ready xBRL-CSV.
            </p>

            <div className="space-y-4 mb-8">
              {BENEFITS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>

            <Link href="/contact">
              <Button size="lg" className="shadow-lg shadow-primary/25">
                Generate Your RoI
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
