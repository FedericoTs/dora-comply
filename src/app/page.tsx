'use client';

import { motion } from 'framer-motion';
import { useLandingAuth } from '@/hooks/use-landing-auth';
import {
  MarketingNav,
  HeroSection,
  TrustBar,
  PlatformSection,
  FourthPartySection,
  BentoFeatures,
  MetricsSection,
  SecuritySection,
  EnterpriseSection,
  Footer,
} from '@/components/marketing/landing';

export default function HomePage() {
  const { isLoading } = useLandingAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <MarketingNav />
      <HeroSection />
      <TrustBar />
      <PlatformSection />
      <FourthPartySection />
      <BentoFeatures />
      <MetricsSection />
      <SecuritySection />
      <EnterpriseSection />
      <Footer />
    </div>
  );
}
