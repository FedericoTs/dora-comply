'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OnboardingCompleteBannerProps {
  firstIncompleteTemplate?: {
    id: string;
    name: string;
  } | null;
}

export function OnboardingCompleteBanner({ firstIncompleteTemplate }: OnboardingCompleteBannerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  const showBanner = searchParams.get('onboarding') === 'complete' && !isDismissed;

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('roi-onboarding-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('roi-onboarding-banner-dismissed', 'true');
    // Clean up URL
    router.replace('/roi', { scroll: false });
  };

  if (!showBanner) return null;

  return (
    <Card className="relative border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>

      <CardContent className="pt-6 pb-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Setup Complete!</span>
              </div>
              <h3 className="text-lg font-semibold">Your RoI structure is ready</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Great job! The wizard has created your Register of Information structure with all 15 ESA templates.
                Now you need to <strong>populate the templates with your actual data</strong> to complete your submission.
              </p>
            </div>

            <div className="bg-background/60 rounded-lg p-3 border border-border/50">
              <p className="text-sm font-medium mb-2">Next steps to complete your RoI:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Add your entity information to Template B_01.01</li>
                <li>Link your vendors to the appropriate templates</li>
                <li>Use AI auto-fill to populate data from uploaded documents</li>
                <li>Review and validate each template before submission</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {firstIncompleteTemplate ? (
                <Button asChild size="sm">
                  <Link href={`/roi/${firstIncompleteTemplate.id}`}>
                    Start with {firstIncompleteTemplate.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href="/roi">
                    View All Templates
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDismiss}>
                Got it, thanks
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
