'use client';

import dynamic from 'next/dynamic';
import type { AIInsight } from '@/components/vendors/ai/vendor-ai-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Dynamic import with ssr:false to prevent hydration issues
const VendorAIInsights = dynamic(
  () => import('@/components/vendors/ai/vendor-ai-insights').then(mod => mod.VendorAIInsights),
  {
    ssr: false,
    loading: () => (
      <Card className="card-premium">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
);

interface VendorInsightsClientProps {
  insights: AIInsight[];
  maxItems?: number;
}

export function VendorInsightsClient({ insights, maxItems = 4 }: VendorInsightsClientProps) {
  return (
    <VendorAIInsights
      insights={insights}
      maxItems={maxItems}
    />
  );
}
