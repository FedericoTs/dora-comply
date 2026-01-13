/**
 * FloatingCard Component
 *
 * Animated floating card for hero section decorative elements.
 */

import { cn } from '@/lib/utils';

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FloatingCard({
  children,
  className,
  delay = 0
}: FloatingCardProps) {
  return (
    <div
      className={cn(
        "absolute bg-white rounded-xl shadow-xl border border-border/50 p-3 animate-float",
        className
      )}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: '3s',
      }}
    >
      {children}
    </div>
  );
}
