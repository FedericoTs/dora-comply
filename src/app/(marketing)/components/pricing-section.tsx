/**
 * PricingSection Component
 *
 * Pricing tiers with annual/monthly toggle.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const PLANS = [
  {
    name: 'Starter',
    priceAnnual: '399',
    priceMonthly: '499',
    period: '/mo',
    description: 'Perfect for small financial entities starting their DORA journey',
    features: [
      'Up to 50 vendors',
      '100 AI document parses/month',
      '5 team members',
      'All 15 RoI templates',
      'Email support',
      'EU data residency',
    ],
    cta: 'Request Access',
    highlighted: false,
  },
  {
    name: 'Professional',
    priceAnnual: '799',
    priceMonthly: '999',
    period: '/mo',
    description: 'For growing teams with complex compliance needs',
    features: [
      'Up to 250 vendors',
      '500 AI document parses/month',
      '20 team members',
      'All 15 RoI templates',
      'Priority support',
      'API access',
      'SSO integration',
      'Custom workflows',
    ],
    cta: 'Request Access',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    priceAnnual: 'Custom',
    priceMonthly: 'Custom',
    period: '',
    description: 'For large institutions with advanced requirements',
    features: [
      'Unlimited vendors',
      'Unlimited AI parses',
      'Unlimited team members',
      'Dedicated success manager',
      'Custom SLA',
      'On-premise option',
      'Advanced security controls',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export function PricingSection() {
  const { ref, isVisible } = useIntersectionObserver();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" ref={ref} className="py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-12 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free. Scale as you grow. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white border">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                !isAnnual ? "bg-primary text-white" : "text-muted-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                isAnnual ? "bg-primary text-white" : "text-muted-foreground"
              )}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-80">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, i) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={i}
                className={cn(
                  "relative p-8 rounded-2xl border-2 transition-all duration-500",
                  plan.highlighted
                    ? "bg-white border-primary shadow-xl scale-105"
                    : "bg-white border-border hover:border-primary/50",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="shadow-lg">{plan.badge}</Badge>
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {price === 'Custom' ? '' : '€'}{price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground mb-6">{plan.description}</p>

                <div className="border-t pt-6 mb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                  <Button
                    className={cn(
                      "w-full",
                      plan.highlighted
                        ? "shadow-lg shadow-primary/25"
                        : "bg-slate-100 text-foreground hover:bg-slate-200"
                    )}
                    variant={plan.highlighted ? "default" : "secondary"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
