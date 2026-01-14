'use client';

import { motion } from 'framer-motion';
import {
  FileSearch,
  FileText,
  AlertTriangle,
  Building2,
  Network,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  GlowCard,
} from '@/components/marketing/animations';

const features = [
  {
    icon: FileSearch,
    title: 'Document Intelligence',
    description: 'Advanced extraction from SOC 2, ISO 27001, and penetration test reports. Automatic control mapping and exception identification.',
    metrics: ['Sub-60 second processing', '47+ control types', 'CUEC detection'],
    color: 'emerald',
  },
  {
    icon: FileText,
    title: 'Register of Information',
    description: 'All 15 ESA-mandated templates with intelligent auto-population. Built-in validation and one-click xBRL-CSV export.',
    metrics: ['15 ESA templates', 'Real-time validation', 'Regulatory export'],
    color: 'teal',
  },
  {
    icon: AlertTriangle,
    title: 'Incident Management',
    description: 'DORA Article 19 compliant workflow with automated classification and deadline tracking across all milestones.',
    metrics: ['4h / 72h / 30d tracking', 'Auto-classification', 'Audit trail'],
    color: 'amber',
  },
  {
    icon: Network,
    title: 'Cross-Framework Mapping',
    description: 'Unified view across DORA, NIS2, GDPR, and ISO 27001. Identify overlaps and gaps automatically.',
    metrics: ['4 frameworks', 'Control inheritance', 'Gap analysis'],
    color: 'blue',
  },
  {
    icon: Building2,
    title: 'Vendor Lifecycle',
    description: 'Complete third-party governance from onboarding through exit. Risk scoring, contracts, and monitoring.',
    metrics: ['Criticality scoring', 'Contract tracking', 'Exit planning'],
    color: 'violet',
  },
  {
    icon: BarChart3,
    title: 'Executive Reporting',
    description: 'Board-ready dashboards and reports. Real-time risk posture, concentration analysis, and trends.',
    metrics: ['Board presentations', 'Regulatory reports', 'Audit packages'],
    color: 'rose',
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  emerald: { bg: '#d1fae5', text: '#059669' },
  teal: { bg: '#ccfbf1', text: '#0d9488' },
  amber: { bg: '#fef3c7', text: '#d97706' },
  blue: { bg: '#dbeafe', text: '#2563eb' },
  violet: { bg: '#ede9fe', text: '#7c3aed' },
  rose: { bg: '#ffe4e6', text: '#e11d48' },
};

export function PlatformSection() {
  return (
    <section id="platform" className="py-16 sm:py-24 lg:py-32 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 lg:mb-20">
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
              The Platform
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
              Complete operational resilience infrastructure
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed">
              Purpose-built for the complexity of modern financial services.
              One unified platform covering the full scope of DORA requirements.
            </p>
          </div>
        </FadeInUp>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const colors = colorMap[feature.color];
            return (
              <StaggerItem key={i}>
                <GlowCard className="h-full">
                  <div className="p-5 sm:p-8">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-6',
                      )}
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed mb-6">{feature.description}</p>
                    <div className="space-y-2">
                      {feature.metrics.map((metric, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-slate-500">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlowCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
