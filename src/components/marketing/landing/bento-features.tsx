'use client';

import { motion } from 'framer-motion';
import {
  FileSearch,
  FileText,
  FileCheck,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import {
  FadeInUp,
  ScaleIn,
} from '@/components/marketing/animations';

export function BentoFeatures() {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 lg:mb-20">
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
              Capabilities
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
              Built for enterprise scale
            </h2>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Large feature - Document Intelligence */}
          <ScaleIn className="col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 sm:mb-6">
                  <FileSearch className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-400" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">Document Intelligence</h3>
                <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed mb-4 sm:mb-8">
                  Upload a SOC 2 or ISO 27001 report and receive structured, actionable insights
                  in under 60 seconds. Our analysis engine does the work.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { value: '<60s', label: 'Processing' },
                    { value: '98%', label: 'Accuracy' },
                    { value: '40h', label: 'Saved' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white/5">
                      <div className="text-lg sm:text-2xl font-semibold text-emerald-400">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </ScaleIn>

          {/* RoI Templates */}
          <ScaleIn delay={0.1} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-emerald-50 border border-emerald-100 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-emerald-200 transition-colors">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">15 ESA Templates</h3>
              <p className="text-sm sm:text-base text-slate-600">All Register of Information templates, auto-populated.</p>
            </motion.div>
          </ScaleIn>

          {/* xBRL Export */}
          <ScaleIn delay={0.2} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-200 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-emerald-100 transition-colors">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">xBRL-CSV Export</h3>
              <p className="text-sm sm:text-base text-slate-600">One-click regulatory export format.</p>
            </motion.div>
          </ScaleIn>

          {/* Incident Tracking */}
          <ScaleIn delay={0.3} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-100 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-amber-200 transition-colors">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">Incident Tracking</h3>
              <p className="text-sm sm:text-base text-slate-600">4h, 72h, 30d deadline automation.</p>
            </motion.div>
          </ScaleIn>

          {/* Cross-Framework */}
          <ScaleIn delay={0.4} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-blue-50 border border-blue-100 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
                <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">4 Frameworks</h3>
              <p className="text-sm sm:text-base text-slate-600">DORA, NIS2, GDPR, ISO 27001 mapped.</p>
            </motion.div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
