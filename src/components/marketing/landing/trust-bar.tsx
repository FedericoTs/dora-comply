'use client';

import { motion } from 'framer-motion';
import { Landmark } from 'lucide-react';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/marketing/animations';

const regulators = [
  { abbr: 'EBA', name: 'European Banking Authority' },
  { abbr: 'EIOPA', name: 'Insurance & Pensions Authority' },
  { abbr: 'ESMA', name: 'Securities & Markets Authority' },
  { abbr: 'ECB', name: 'European Central Bank' },
];

export function TrustBar() {
  return (
    <section className="py-10 sm:py-16 bg-white border-y border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 mb-6 sm:mb-10">
            Aligned with regulatory frameworks from European supervisory authorities
          </p>
        </FadeInUp>
        <StaggerContainer className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-16 gap-y-6 sm:gap-y-8">
          {regulators.map((reg) => (
            <StaggerItem key={reg.abbr}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0">
                  <Landmark className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-emerald-600 transition-colors">{reg.abbr}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">{reg.name}</div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
