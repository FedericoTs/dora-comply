/**
 * FeaturesGrid Component
 *
 * Displays main platform features in a grid layout.
 */

'use client';

import {
  FileSearch,
  FileText,
  AlertTriangle,
  Building2,
  Network,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const FEATURES = [
  {
    icon: FileSearch,
    title: 'AI Document Parsing',
    description: 'Upload SOC 2, ISO 27001, and pen test reports. Our AI extracts controls, exceptions, and findings in under 60 seconds.',
    badge: 'Core Feature',
    color: 'primary',
  },
  {
    icon: FileText,
    title: 'Register of Information',
    description: 'All 15 ESA-mandated templates auto-populated from your vendor data. Export to xBRL-CSV with one click.',
    badge: 'DORA Art. 28',
    color: 'info',
  },
  {
    icon: AlertTriangle,
    title: 'Incident Reporting',
    description: 'DORA Article 19 compliant workflow with automated deadline tracking: 4-hour, 72-hour, and 30-day reports.',
    badge: 'DORA Art. 19',
    color: 'warning',
  },
  {
    icon: Network,
    title: 'Cross-Framework Mapping',
    description: 'Automatic mapping between DORA, NIS2, GDPR, and ISO 27001. See compliance coverage across all frameworks.',
    badge: 'Multi-Framework',
    color: 'purple',
  },
  {
    icon: Building2,
    title: 'Vendor Management',
    description: 'Complete vendor lifecycle from onboarding to exit. Track criticality, contracts, and risk scores in one place.',
    badge: 'ICT Third Parties',
    color: 'success',
  },
  {
    icon: BarChart3,
    title: 'Risk Dashboard',
    description: 'Real-time risk scoring with trend analysis. Board-ready reports and concentration risk monitoring.',
    badge: 'Analytics',
    color: 'chart-4',
  },
];

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  purple: 'bg-purple-500/10 text-purple-500',
  success: 'bg-success/10 text-success',
  'chart-4': 'bg-violet-500/10 text-violet-500',
};

export function FeaturesGrid() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section id="features" ref={ref} className="py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Complete Platform</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need for DORA compliance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One platform. All requirements. Full regulatory coverage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={cn(
                  "group relative p-8 rounded-2xl bg-white border hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-6",
                  COLOR_MAP[feature.color]
                )}>
                  <Icon className="h-7 w-7" />
                </div>
                <Badge variant="outline" className="mb-3 text-xs">
                  {feature.badge}
                </Badge>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
