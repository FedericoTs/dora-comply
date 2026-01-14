'use client';

import { motion } from 'framer-motion';
import {
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
} from '@/components/marketing/animations';

const metrics = [
  { value: 60, suffix: 's', prefix: '<', label: 'Document processing' },
  { value: 15, label: 'ESA templates' },
  { value: 4, label: 'Frameworks mapped' },
  { value: 100, suffix: '%', label: 'EU data residency' },
];

export function MetricsSection() {
  return (
    <section className="py-16 sm:py-24 bg-emerald-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-emerald-500 rounded-full blur-[100px] sm:blur-[200px]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-16">
          {metrics.map((stat, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-5xl lg:text-6xl font-semibold mb-1 sm:mb-2">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={2.5} />
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-emerald-200/60">{stat.label}</div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
