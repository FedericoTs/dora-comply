'use client';

import { useState, useTransition } from 'react';
import {
  Newspaper,
  FileText,
  ShieldAlert,
  Building2,
  RefreshCw,
  Settings,
  Bell,
  BellOff,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewsAlertItem } from './news-alert-item';
import { BreachExposureCard } from './breach-exposure-card';
import { cn } from '@/lib/utils';
import type { VendorIntelligence, VendorNewsAlert } from '@/lib/intelligence/types';
import type { DomainBreachResult } from '@/lib/external/hibp-types';
import type { SECFilingsResult } from '@/lib/external/sec-edgar-types';

// =============================================================================
// TYPES
// =============================================================================

interface IntelligenceTabProps {
  vendorId: string;
  vendorName: string;
  domain?: string;
  intelligence?: VendorIntelligence | null;
  breachData?: DomainBreachResult | null;
  secFilings?: SECFilingsResult | null;
  isMonitoringEnabled?: boolean;
  onToggleMonitoring?: (enabled: boolean) => Promise<void>;
  onSync?: () => Promise<void>;
  onMarkRead?: (alertId: string) => Promise<void>;
  onDismiss?: (alertId: string) => Promise<void>;
  onUpdateKeywords?: (keywords: string[]) => Promise<void>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function IntelligenceTab({
  vendorId,
  vendorName,
  domain,
  intelligence,
  breachData,
  secFilings,
  isMonitoringEnabled = false,
  onToggleMonitoring,
  onSync,
  onMarkRead,
  onDismiss,
  onUpdateKeywords,
}: IntelligenceTabProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('overview');
  const [keywords, setKeywords] = useState<string>(
    intelligence?.news.recentAlerts[0]?.keywords?.join(', ') || ''
  );
  const [showSettings, setShowSettings] = useState(false);

  const handleSync = () => {
    if (!onSync) return;
    startTransition(async () => {
      await onSync();
    });
  };

  const handleToggleMonitoring = () => {
    if (!onToggleMonitoring) return;
    startTransition(async () => {
      await onToggleMonitoring(!isMonitoringEnabled);
    });
  };

  const handleSaveKeywords = () => {
    if (!onUpdateKeywords) return;
    const keywordList = keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    startTransition(async () => {
      await onUpdateKeywords(keywordList);
    });
  };

  const alerts = intelligence?.news.recentAlerts || [];
  const unreadCount = intelligence?.summary.unreadAlerts || 0;
  const overallSeverity = intelligence?.summary.overallSeverity || 'low';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Business Intelligence
          </h2>
          <p className="text-sm text-gray-500">
            News monitoring, breach exposure, and SEC filings for {vendorName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Monitoring toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="monitoring"
              checked={isMonitoringEnabled}
              onCheckedChange={handleToggleMonitoring}
              disabled={isPending}
            />
            <Label htmlFor="monitoring" className="text-sm cursor-pointer">
              {isMonitoringEnabled ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Bell className="h-4 w-4" /> Monitoring
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500">
                  <BellOff className="h-4 w-4" /> Disabled
                </span>
              )}
            </Label>
          </div>

          {/* Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>

          {/* Sync */}
          {onSync && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSync}
              disabled={isPending}
            >
              <RefreshCw
                className={cn('h-4 w-4 mr-1', isPending && 'animate-spin')}
              />
              Sync Now
            </Button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="keywords">Custom Keywords</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Additional keywords to monitor (comma-separated)
                </p>
                <div className="flex gap-2">
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., acquisition, IPO, cybersecurity"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSaveKeywords}
                    disabled={isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Newspaper className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {intelligence?.news.alertCount || 0}
                </p>
                <p className="text-xs text-gray-500">News Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  (breachData?.breachCount || 0) > 0
                    ? 'bg-red-500/10'
                    : 'bg-green-500/10'
                )}
              >
                <ShieldAlert
                  className={cn(
                    'h-5 w-5',
                    (breachData?.breachCount || 0) > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  )}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {breachData?.breachCount || 0}
                </p>
                <p className="text-xs text-gray-500">Breaches Found</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {secFilings?.totalFilings || 0}
                </p>
                <p className="text-xs text-gray-500">SEC Filings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  overallSeverity === 'critical'
                    ? 'bg-red-500/10'
                    : overallSeverity === 'high'
                      ? 'bg-orange-500/10'
                      : overallSeverity === 'medium'
                        ? 'bg-yellow-500/10'
                        : 'bg-green-500/10'
                )}
              >
                {overallSeverity === 'low' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle
                    className={cn(
                      'h-5 w-5',
                      overallSeverity === 'critical'
                        ? 'text-red-600'
                        : overallSeverity === 'high'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                    )}
                  />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold capitalize">{overallSeverity}</p>
                <p className="text-xs text-gray-500">Risk Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Newspaper className="h-4 w-4" />
            News
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="breaches" className="flex items-center gap-1">
            <ShieldAlert className="h-4 w-4" />
            Breaches
            {(breachData?.breachCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {breachData?.breachCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="filings" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            SEC Filings
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            Company Data
          </TabsTrigger>
        </TabsList>

        {/* News Tab */}
        <TabsContent value="overview" className="mt-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No news alerts yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  {isMonitoringEnabled
                    ? 'Alerts will appear here when news is found'
                    : 'Enable monitoring to receive news alerts'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <NewsAlertItem
                  key={alert.id}
                  alert={alert}
                  onMarkRead={onMarkRead}
                  onDismiss={onDismiss}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Breaches Tab */}
        <TabsContent value="breaches" className="mt-4">
          {domain ? (
            <BreachExposureCard
              domain={domain}
              breachData={breachData}
              onRefresh={onSync}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ShieldAlert className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No domain configured</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add a website URL to check breach exposure
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEC Filings Tab */}
        <TabsContent value="filings" className="mt-4">
          {secFilings && secFilings.filings.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    SEC EDGAR Filings
                    {secFilings.company?.ticker && (
                      <Badge variant="outline" className="ml-2">
                        {secFilings.company.ticker}
                      </Badge>
                    )}
                  </CardTitle>
                  {secFilings.company?.cik && (
                    <a
                      href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${secFilings.company.cik}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      View on SEC <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {secFilings.filings.slice(0, 10).map((filing) => (
                    <div
                      key={filing.accessionNumber}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{filing.form}</Badge>
                          <span className="text-sm font-medium">
                            {filing.description || 'Filing'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Filed: {new Date(filing.filedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {filing.primaryDocUrl && (
                        <a
                          href={filing.primaryDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No SEC filings found</p>
                <p className="text-sm text-gray-400 mt-1">
                  This company may not be publicly traded in the US
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Company Data Tab */}
        <TabsContent value="company" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Company data coming soon</p>
              <p className="text-sm text-gray-400 mt-1">
                OpenCorporates integration in development
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
