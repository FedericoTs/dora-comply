/**
 * SecuritySection Component
 *
 * Trust and security badges.
 */

'use client';

import { Globe, ShieldCheck, Lock, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const SECURITY_BADGES = [
  { icon: Globe, label: 'EU Data Residency', sublabel: 'Frankfurt data center' },
  { icon: ShieldCheck, label: 'SOC 2 Type II', sublabel: 'Certified compliant' },
  { icon: Lock, label: 'ISO 27001', sublabel: 'Information security' },
  { icon: Server, label: 'GDPR Compliant', sublabel: 'Full privacy protection' },
];

export function SecuritySection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section id="security" ref={ref} className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Security First</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for enterprise security
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your compliance data deserves the highest level of protection
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECURITY_BADGES.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div
                key={i}
                className={cn(
                  "text-center p-8 rounded-2xl bg-slate-50 border transition-all duration-500 hover:shadow-lg",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="font-semibold mb-1">{badge.label}</div>
                <div className="text-sm text-muted-foreground">{badge.sublabel}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
