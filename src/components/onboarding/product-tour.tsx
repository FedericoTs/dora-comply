'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_STORAGE_KEY = 'nis2-comply-tour-completed';
const TOUR_VERSION = '1.0'; // Increment to re-show tour after major updates

interface ProductTourProps {
  /** Force show tour even if completed */
  forceShow?: boolean;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is dismissed */
  onDismiss?: () => void;
}

// Tour steps for the dashboard
const dashboardTourSteps: DriveStep[] = [
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: 'Welcome to NIS2 Comply!',
      description: 'Let\'s take a quick tour to help you get started with your compliance journey. This will only take a minute.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Navigation',
      description: 'Use the sidebar to navigate between different modules: Vendors, Documents, Register of Information, Incidents, and more.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="stats-grid"]',
    popover: {
      title: 'Key Metrics',
      description: 'Track your compliance progress at a glance. Monitor vendors, RoI readiness, risk levels, incidents, and your deadline countdown.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="recent-activity"]',
    popover: {
      title: 'Recent Activity',
      description: 'Stay informed with real-time updates on vendor assessments, document uploads, and compliance changes across your organization.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="getting-started"]',
    popover: {
      title: 'Getting Started Checklist',
      description: 'Follow these steps to complete your NIS2 compliance setup. Each step takes you to the relevant section.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="add-vendor"]',
    popover: {
      title: 'Add Your First Vendor',
      description: 'Click here to register your first third-party provider. This is the foundation of your NIS2 supply chain security program.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="deadline"]',
    popover: {
      title: 'RoI Deadline Countdown',
      description: 'Track time remaining until your Register of Information submission deadline. Stay on top of your compliance timeline.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="copilot"]',
    popover: {
      title: 'AI Compliance Copilot',
      description: 'Need help? Click the chat button to ask questions about NIS2 and DORA compliance, get guidance, or analyze your vendor data.',
      side: 'left',
      align: 'end',
    },
  },
];

export function ProductTour({ forceShow = false, onComplete, onDismiss }: ProductTourProps) {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const pathname = usePathname();

  // Check if tour should be shown
  // Intentional SSR hydration pattern
  useEffect(() => {
    if (forceShow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldShowTour(true);
      return;
    }

    // Only show on dashboard
    if (pathname !== '/dashboard') {
      return;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === TOUR_VERSION && data.completed) {
          return; // Tour already completed
        }
      }
      // First visit or version mismatch - show tour
      setShouldShowTour(true);
    } catch {
      // On error, show tour
      setShouldShowTour(true);
    }
  }, [forceShow, pathname]);

  // Mark tour as completed
  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
        version: TOUR_VERSION,
        completed: true,
        completedAt: new Date().toISOString(),
      }));
    } catch {
      // Ignore storage errors
    }
    setShouldShowTour(false);
    onComplete?.();
  }, [onComplete]);

  // Handle tour dismissal
  const dismissTour = useCallback(() => {
    completeTour(); // Also mark as completed to not show again
    onDismiss?.();
  }, [completeTour, onDismiss]);

  // Start tour
  useEffect(() => {
    if (!shouldShowTour) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        steps: dashboardTourSteps,
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Get Started!',
        progressText: '{{current}} of {{total}}',
        popoverClass: 'nis2-tour-popover',
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep()) {
            completeTour();
          } else {
            dismissTour();
          }
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }, 500);

    return () => clearTimeout(timer);
  }, [shouldShowTour, completeTour, dismissTour]);

  return null; // This component doesn't render anything
}

/**
 * Hook to manually control the tour
 */
export function useTour() {
  const [isActive, setIsActive] = useState(false);

  const startTour = useCallback(() => {
    // Reset completion status
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsActive(true);
    // Force page refresh to trigger tour
    window.location.reload();
  }, []);

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { isActive, startTour, resetTour };
}

/**
 * Button to restart the tour
 */
export function TourRestartButton({ className }: { className?: string }) {
  const { startTour } = useTour();

  return (
    <button
      onClick={startTour}
      className={className}
      type="button"
    >
      Restart Tour
    </button>
  );
}
