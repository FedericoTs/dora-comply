'use client';

import { useState, useTransition, useEffect } from 'react';
import { IntelligenceTab } from '@/components/vendors/intelligence';
import type { VendorIntelligence } from '@/lib/intelligence/types';
import type { DomainBreachResult } from '@/lib/external/hibp-types';
import type { SECFilingsResult } from '@/lib/external/sec-edgar-types';
import type { IntelligenceSeverity } from '@/lib/intelligence/types';

// Risk score data type matching the API response
interface RiskScoreData {
  composite: number;
  level: IntelligenceSeverity;
  trend: 'improving' | 'stable' | 'degrading';
  trendChange: number;
  components: {
    news: number;
    breach: number;
    filing: number;
    cyber: number;
  };
  weights: {
    news: number;
    breach: number;
    filing: number;
    cyber: number;
  };
  criticalAlerts: number;
  highAlerts: number;
  unresolvedAlerts: number;
  lastCalculated?: string;
}

interface VendorIntelligenceWrapperProps {
  vendorId: string;
  vendorName: string;
  domain?: string;
  isMonitoringEnabled?: boolean;
}

export function VendorIntelligenceWrapper({
  vendorId,
  vendorName,
  domain,
  isMonitoringEnabled = false,
}: VendorIntelligenceWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(isMonitoringEnabled);
  const [intelligence, setIntelligence] = useState<VendorIntelligence | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScoreData | null>(null);
  const [breachData, setBreachData] = useState<DomainBreachResult | null>(null);
  const [secFilings, setSecFilings] = useState<SECFilingsResult | null>(null);

  // Fetch intelligence data on mount
  useEffect(() => {
    handleRefreshIntelligence();
  }, [vendorId]);

  const handleToggleMonitoring = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/intelligence/${vendorId}/monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setMonitoring(enabled);
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/intelligence/${vendorId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Update risk score from sync response if available
        if (data.riskScore) {
          setRiskScore(data.riskScore);
        }
        // Refresh the full intelligence data
        await handleRefreshIntelligence();
      }
    } catch (error) {
      console.error('Failed to sync intelligence:', error);
      setIsLoading(false);
    }
  };

  const handleRefreshIntelligence = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/intelligence/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        setIntelligence(data.intelligence);
        setRiskScore(data.riskScore);
        setBreachData(data.breachData);
        setSecFilings(data.secFilings);
      }
    } catch (error) {
      console.error('Failed to refresh intelligence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (alertId: string) => {
    try {
      await fetch(`/api/intelligence/alerts/${alertId}/read`, {
        method: 'POST',
      });
      // Update local state
      if (intelligence) {
        setIntelligence({
          ...intelligence,
          news: {
            ...intelligence.news,
            recentAlerts: intelligence.news.recentAlerts.map((a) =>
              a.id === alertId ? { ...a, is_read: true } : a
            ),
            unreadCount: intelligence.news.unreadCount - 1,
          },
          summary: {
            ...intelligence.summary,
            unreadAlerts: intelligence.summary.unreadAlerts - 1,
          },
        });
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await fetch(`/api/intelligence/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });
      // Update local state
      if (intelligence) {
        setIntelligence({
          ...intelligence,
          news: {
            ...intelligence.news,
            recentAlerts: intelligence.news.recentAlerts.filter((a) => a.id !== alertId),
            alertCount: intelligence.news.alertCount - 1,
          },
          summary: {
            ...intelligence.summary,
            totalAlerts: intelligence.summary.totalAlerts - 1,
          },
        });
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleUpdateKeywords = async (keywords: string[]) => {
    try {
      await fetch(`/api/intelligence/${vendorId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });
    } catch (error) {
      console.error('Failed to update keywords:', error);
    }
  };

  return (
    <IntelligenceTab
      vendorId={vendorId}
      vendorName={vendorName}
      domain={domain}
      intelligence={intelligence}
      riskScore={riskScore}
      breachData={breachData}
      secFilings={secFilings}
      isMonitoringEnabled={monitoring}
      isLoadingScore={isLoading}
      onToggleMonitoring={handleToggleMonitoring}
      onSync={handleSync}
      onMarkRead={handleMarkRead}
      onDismiss={handleDismiss}
      onUpdateKeywords={handleUpdateKeywords}
    />
  );
}
