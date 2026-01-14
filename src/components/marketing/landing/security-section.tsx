'use client';

import { motion } from 'framer-motion';
import {
  Globe,
  ShieldCheck,
  Lock,
  Server,
  Scale,
} from 'lucide-react';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/marketing/animations';

const securityBadges = [
  { icon: Globe, title: 'EU Data Residency', description: 'Frankfurt. Zero cross-border transfers.' },
  { icon: ShieldCheck, title: 'SOC 2 Type II', description: 'Independently audited controls.' },
  { icon: Lock, title: 'ISO 27001', description: 'Certified ISMS.' },
  { icon: Server, title: 'GDPR Compliant', description: 'Full privacy protection.' },
];

const regulations = ['DORA', 'NIS2', 'GDPR', 'MaRisk', 'BAIT'];

export function SecuritySection() {
  return (
    <section id="security" className="py-16 sm:py-24 lg:py-32 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
              Security & Compliance
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
              Enterprise-grade security
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600">
              Your compliance data requires the highest standards. We exceed them.
            </p>
          </div>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {securityBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <StaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="text-center p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-2 sm:mb-4"
                  >
                    <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-600" />
                  </motion.div>
                  <div className="font-semibold text-sm sm:text-base text-slate-900 mb-1 sm:mb-2">{badge.title}</div>
                  <div className="text-xs sm:text-sm text-slate-500">{badge.description}</div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeInUp>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-slate-900">Regulatory-ready architecture</div>
                  <div className="text-xs sm:text-sm text-slate-500">Built for supervisory examination</div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {regulations.map((reg) => (
                  <motion.span
                    key={reg}
                    whileHover={{ scale: 1.05 }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                  >
                    {reg}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </FadeInUp>
      </div>
    </section>
  );
}
