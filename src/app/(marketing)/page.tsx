/**
 * Marketing Landing Page
 *
 * Main entry point for the marketing site.
 * All sections are extracted to individual components.
 */

import {
  HeroSection,
  SocialProofBar,
  ProblemSection,
  FeaturesGrid,
  AIParsingSection,
  RoISection,
  StatsSection,
  TestimonialsSection,
  PricingSection,
  SecuritySection,
  FinalCTA,
  Footer,
} from './components';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <FeaturesGrid />
      <AIParsingSection />
      <RoISection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <SecuritySection />
      <FinalCTA />
      <Footer />

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        @keyframes progress {
          0% { width: 0%; }
          100% { width: 65%; }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 2s ease-out forwards;
        }
      `}</style>
    </>
  );
}
