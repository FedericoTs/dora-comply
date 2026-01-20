'use client';

/**
 * VendorPortalSteps Component
 *
 * Step indicator for the vendor portal wizard
 */

import Link from 'next/link';
import { CheckCircle2, Upload, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorPortalStepsProps {
  currentStep: number;
  token: string;
  completedSteps?: number[];
}

const steps = [
  { number: 1, title: 'Documents', icon: Upload, href: '/documents' },
  { number: 2, title: 'Questions', icon: FileText, href: '/questions' },
  { number: 3, title: 'Review', icon: Eye, href: '/review' },
];

export function VendorPortalSteps({
  currentStep,
  token,
  completedSteps = [],
}: VendorPortalStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number) || step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const Icon = isCompleted ? CheckCircle2 : step.icon;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step Circle */}
              <Link
                href={`/q/${token}${step.href}`}
                className={cn(
                  'flex flex-col items-center',
                  step.number > currentStep && 'pointer-events-none opacity-50'
                )}
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                    isCompleted && 'bg-emerald-600 text-white',
                    isCurrent && !isCompleted && 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-600',
                    !isCurrent && !isCompleted && 'bg-gray-100 text-gray-400'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    isCurrent ? 'text-emerald-600' : 'text-gray-500'
                  )}
                >
                  {step.title}
                </span>
              </Link>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-0.5 mx-2 mt-[-1.5rem]',
                    step.number < currentStep ? 'bg-emerald-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
