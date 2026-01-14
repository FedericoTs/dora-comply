'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CircuitBoard,
  LinkIcon,
  Eye,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
  MagneticButton,
} from '@/components/marketing/animations';

const capabilities = [
  { icon: LinkIcon, title: 'Automatic Chain Detection', description: 'Extract subcontractor info from SOC 2 reports and contracts' },
  { icon: Eye, title: 'Concentration Monitoring', description: 'Identify when multiple vendors depend on the same provider' },
  { icon: Target, title: 'Risk Propagation', description: 'Understand how fourth-party issues cascade to operations' },
];

export function FourthPartySection() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-emerald-950 text-white overflow-hidden relative">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <FadeInUp>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6 sm:mb-8">
                <CircuitBoard className="h-4 w-4" />
                <span className="text-sm font-medium">Deep Supply Chain Visibility</span>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <h2 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold tracking-[-0.02em] mb-4 sm:mb-6">
                See beyond your direct vendors
              </h2>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="text-base sm:text-lg lg:text-xl text-emerald-100/70 leading-relaxed mb-8 sm:mb-10">
                DORA requires visibility into subcontracting chains. Our platform automatically
                maps fourth-party relationships, identifying concentration risks before they
                become regulatory findings.
              </p>
            </FadeInUp>

            <StaggerContainer staggerDelay={0.15} className="space-y-6 mb-10">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.title}>
                    <motion.div
                      whileHover={{ x: 10 }}
                      className="flex gap-4 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">{item.title}</div>
                        <div className="text-sm text-emerald-200/60">{item.description}</div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            <FadeInUp delay={0.5}>
              <MagneticButton>
                <Link href="/contact">
                  <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 shadow-xl">
                    See Fourth-Party Mapping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </MagneticButton>
            </FadeInUp>
          </div>

          <ScaleIn delay={0.3}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-transparent to-emerald-950 z-10 pointer-events-none" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative rounded-2xl bg-emerald-900/50 border border-emerald-800/50 p-8"
              >
                <div className="space-y-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex justify-center"
                  >
                    <div className="px-6 py-3 rounded-xl bg-white text-emerald-950 font-semibold shadow-lg">
                      Your Organization
                    </div>
                  </motion.div>

                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      viewport={{ once: true }}
                      className="w-px h-8 bg-emerald-600/50 origin-top"
                    />
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 sm:gap-6">
                    {['Cloud Provider', 'Payment Processor', 'Data Analytics'].map((vendor, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-emerald-800/50 text-xs sm:text-sm font-medium text-white border border-emerald-700/50 cursor-pointer"
                      >
                        {vendor}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="w-px h-8 bg-emerald-700/50 origin-top"
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                    {['CDN', 'DNS', 'Auth', 'Storage', 'Monitor', 'Cards', 'Fraud', 'ML', 'Lake', 'API'].map((sub, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.05 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                          'px-1 sm:px-2 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs text-center cursor-pointer transition-colors',
                          i === 3 || i === 6 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-800/30 text-emerald-200/70 border border-emerald-700/30 hover:bg-emerald-800/50'
                        )}
                      >
                        {sub}
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    viewport={{ once: true }}
                    className="mt-6 pt-6 border-t border-emerald-800/50 flex items-center justify-between"
                  >
                    <div className="text-sm text-emerald-200/70">
                      <span className="text-amber-400 font-medium">2 concentration risks</span> detected
                    </div>
                    <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-emerald-800/50 text-emerald-200">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Live
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
