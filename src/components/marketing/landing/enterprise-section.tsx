'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Workflow,
  Shield,
  Zap,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FadeInUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  MagneticButton,
} from '@/components/marketing/animations';

const enterpriseFeatures = [
  { icon: Users, text: 'Dedicated implementation team' },
  { icon: Workflow, text: 'Custom workflow configuration' },
  { icon: Shield, text: 'Security review and DPA' },
  { icon: Zap, text: 'Priority support SLA' },
];

const consultationIncludes = [
  'Personalized platform demonstration',
  'DORA readiness assessment',
  'Implementation roadmap',
];

export function EnterpriseSection() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScaleIn>
          <div className="max-w-5xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.005 }}
              className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="grid lg:grid-cols-2">
                <div className="p-6 sm:p-10 lg:p-14">
                  <FadeInUp>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
                      Enterprise
                    </p>
                  </FadeInUp>
                  <FadeInUp delay={0.1}>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
                      Purpose-built for financial institutions
                    </h2>
                  </FadeInUp>
                  <FadeInUp delay={0.2}>
                    <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-10">
                      We work exclusively with regulated financial entities. Our teams understand
                      your compliance requirements, your timelines, and your stakeholders.
                    </p>
                  </FadeInUp>

                  <StaggerContainer staggerDelay={0.1} className="space-y-3 sm:space-y-4">
                    {enterpriseFeatures.map((item) => {
                      const Icon = item.icon;
                      return (
                        <StaggerItem key={item.text}>
                          <motion.div
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-2 sm:gap-3"
                          >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                            </div>
                            <span className="text-sm sm:text-base text-slate-700">{item.text}</span>
                          </motion.div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                </div>

                <div className="bg-emerald-950 p-6 sm:p-10 lg:p-14 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-400 rounded-full blur-[100px]" />
                  </div>
                  <div className="relative">
                    <FadeInUp>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-3 sm:mb-4">Request access</h3>
                    </FadeInUp>
                    <FadeInUp delay={0.1}>
                      <p className="text-emerald-100/70 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
                        Schedule a consultation with our team to discuss your compliance
                        requirements and see the platform.
                      </p>
                    </FadeInUp>

                    <StaggerContainer staggerDelay={0.1} className="space-y-3 sm:space-y-4 mb-6 sm:mb-10">
                      {consultationIncludes.map((item) => (
                        <StaggerItem key={item}>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>

                    <FadeInUp delay={0.4}>
                      <MagneticButton>
                        <Link href="/contact">
                          <Button size="lg" className="w-full h-12 sm:h-14 bg-white text-emerald-950 hover:bg-emerald-50 font-semibold text-base sm:text-lg shadow-xl">
                            Schedule Consultation
                            <ArrowUpRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </Link>
                      </MagneticButton>
                    </FadeInUp>

                    <FadeInUp delay={0.5}>
                      <p className="text-center text-xs sm:text-sm text-emerald-200/50 mt-4 sm:mt-6">
                        Response within one business day
                      </p>
                    </FadeInUp>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </ScaleIn>
      </div>
    </section>
  );
}
