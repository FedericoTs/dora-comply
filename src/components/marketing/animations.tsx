'use client';

/**
 * Premium Animation Components
 *
 * Reusable animation primitives for the marketing landing page.
 * Uses Framer Motion for smooth, performant animations.
 */

import { useRef, ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform, Variants } from 'framer-motion';

// ============================================================================
// Fade In Up - Scroll triggered fade with upward motion
// ============================================================================

interface FadeInUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeInUp({ children, delay = 0, duration = 0.6, className }: FadeInUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Stagger Container - Staggers children animations
// ============================================================================

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({ children, staggerDelay = 0.1, className }: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Stagger Item - Child of StaggerContainer
// ============================================================================

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// Scale In - Scales up from smaller size
// ============================================================================

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Parallax - Scroll-based parallax effect
// ============================================================================

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.5, className }: ParallaxProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100 * speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// Animated Counter - Numbers that count up
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2, className }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isInView ? (
          <CountUp end={value} duration={duration} />
        ) : (
          '0'
        )}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

// Simple count up component
function CountUp({ end, duration }: { end: number; duration: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      onAnimationStart={() => {
        if (ref.current) {
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            // Easing function for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * end);
            if (ref.current) {
              ref.current.textContent = current.toString();
            }
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
      }}
    >
      0
    </motion.span>
  );
}

// ============================================================================
// Glow Card - Card with animated glow border on hover
// ============================================================================

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({ children, className, glowColor = 'emerald' }: GlowCardProps) {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {/* Glow effect */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r from-${glowColor}-600 to-${glowColor}-400 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
      />
      {/* Card content */}
      <div className="relative bg-white rounded-2xl border border-slate-200 group-hover:border-slate-300 transition-colors duration-300">
        {children}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Magnetic Button - Button that follows cursor slightly
// ============================================================================

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

export function MagneticButton({ children, className }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'translate(0, 0)';
    }
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ${className}`}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Text Reveal - Text that reveals character by character
// ============================================================================

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const words = children.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: '100%' }}
            animate={isInView ? { y: 0 } : { y: '100%' }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.05,
              ease: [0.25, 0.4, 0.25, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  );
}

// ============================================================================
// Floating Element - Subtle floating animation
// ============================================================================

interface FloatingProps {
  children: ReactNode;
  duration?: number;
  distance?: number;
  className?: string;
}

export function Floating({ children, duration = 3, distance = 10, className }: FloatingProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Blur In - Fades in with blur effect
// ============================================================================

interface BlurInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function BlurIn({ children, delay = 0, className }: BlurInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={isInView ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
