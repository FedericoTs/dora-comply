/**
 * Intersection Observer Hook
 *
 * Provides scroll-triggered visibility detection for animations.
 * Used across marketing page sections for entrance animations.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Only trigger once (default: true) */
  triggerOnce?: boolean;
}

export function useIntersectionObserver(options?: UseIntersectionObserverOptions) {
  const { triggerOnce = true, ...observerOptions } = options ?? {};
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          observer.disconnect();
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    }, { threshold: 0.1, ...observerOptions });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [triggerOnce]);

  return { ref, isVisible };
}
