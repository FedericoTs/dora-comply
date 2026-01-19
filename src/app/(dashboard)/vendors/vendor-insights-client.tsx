'use client';

import { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import type { AIInsight } from '@/components/vendors/ai/vendor-ai-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { fetchPortfolioInsights } from '@/lib/vendors/actions';

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
  insights?: AIInsight[];
  maxItems?: number;
}

export function VendorInsightsClient({ insights: providedInsights, maxItems = 4 }: VendorInsightsClientProps) {
  const [insights, setInsights] = useState<AIInsight[]>(providedInsights || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(!!providedInsights);

  // Fetch real insights on mount if not provided
  useEffect(() => {
    if (providedInsights) {
      setInsights(providedInsights);
      setHasLoaded(true);
      return;
    }

    startTransition(async () => {
      try {
        const serverInsights = await fetchPortfolioInsights();
        // Map server insights to component format
        const mappedInsights: AIInsight[] = serverInsights.map(i => ({
          id: i.id,
          type: i.type,
          priority: i.priority,
          title: i.title,
          summary: i.summary,
          details: i.details,
          affectedVendorIds: i.affectedVendorIds,
          affectedVendorNames: i.affectedVendorNames,
          suggestedAction: i.suggestedAction,
          actionHref: i.actionHref,
          createdAt: i.createdAt,
        }));
        setInsights(mappedInsights);
      } catch (error) {
        console.error('Failed to fetch portfolio insights:', error);
      } finally {
        setHasLoaded(true);
      }
    });
  }, [providedInsights]);

  const handleRefresh = async () => {
    setIsGenerating(true);
    try {
      const serverInsights = await fetchPortfolioInsights();
      const mappedInsights: AIInsight[] = serverInsights.map(i => ({
        id: i.id,
        type: i.type,
        priority: i.priority,
        title: i.title,
        summary: i.summary,
        details: i.details,
        affectedVendorIds: i.affectedVendorIds,
        affectedVendorNames: i.affectedVendorNames,
        suggestedAction: i.suggestedAction,
        actionHref: i.actionHref,
        createdAt: i.createdAt,
      }));
      setInsights(mappedInsights);
    } catch (error) {
      console.error('Failed to refresh portfolio insights:', error);
    }
    setIsGenerating(false);
  };

  const isLoading = isPending && !hasLoaded;

  return (
    <VendorAIInsights
      insights={insights}
      maxItems={maxItems}
      isLoading={isLoading}
      isGenerating={isGenerating}
      onRefresh={handleRefresh}
    />
  );
}
