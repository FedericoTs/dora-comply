'use client';

import { useState, useTransition } from 'react';
import { IntelligenceTab } from '@/components/vendors/intelligence';
import type { VendorIntelligence, VendorNewsAlert } from '@/lib/intelligence/types';
import type { DomainBreachResult } from '@/lib/external/hibp-types';
import type { SECFilingsResult } from '@/lib/external/sec-edgar-types';

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
  const [monitoring, setMonitoring] = useState(isMonitoringEnabled);
  const [intelligence, setIntelligence] = useState<VendorIntelligence | null>(null);
  const [breachData, setBreachData] = useState<DomainBreachResult | null>(null);
  const [secFilings, setSecFilings] = useState<SECFilingsResult | null>(null);

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
      const response = await fetch(`/api/intelligence/${vendorId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh the intelligence data
        await handleRefreshIntelligence();
      }
    } catch (error) {
      console.error('Failed to sync intelligence:', error);
    }
  };

  const handleRefreshIntelligence = async () => {
    try {
      const response = await fetch(`/api/intelligence/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        setIntelligence(data.intelligence);
        setBreachData(data.breachData);
        setSecFilings(data.secFilings);
      }
    } catch (error) {
      console.error('Failed to refresh intelligence:', error);
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
      breachData={breachData}
      secFilings={secFilings}
      isMonitoringEnabled={monitoring}
      onToggleMonitoring={handleToggleMonitoring}
      onSync={handleSync}
      onMarkRead={handleMarkRead}
      onDismiss={handleDismiss}
      onUpdateKeywords={handleUpdateKeywords}
    />
  );
}
