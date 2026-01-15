'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Clock,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  checkSanctions,
  isSanctionsError,
  formatSanctionsMatch,
  type SanctionsResult,
} from '@/lib/external/opensanctions';
import type { Vendor } from '@/lib/vendors/types';
import type { VendorCertification } from '@/lib/certifications/types';
import { VendorCertifications } from './vendor-certifications';

interface SanctionsConfig {
  configured: boolean;
  provider: string;
  signupUrl: string;
  description: string;
}

interface VendorEnrichmentTabProps {
  vendor: Vendor;
}

export function VendorEnrichmentTab({ vendor }: VendorEnrichmentTabProps) {
  const [sanctionsResult, setSanctionsResult] = useState<SanctionsResult | null>(null);
  const [isCheckingSanctions, setIsCheckingSanctions] = useState(false);
  const [sanctionsError, setSanctionsError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sanctionsConfig, setSanctionsConfig] = useState<SanctionsConfig | null>(null);
  const [certifications, setCertifications] = useState<VendorCertification[]>([]);

  // Fetch certifications (sanctions config check disabled - API no longer free)
  useEffect(() => {
    async function fetchData() {
      try {
        // Sanctions config check disabled - OpenSanctions API now requires paid subscription
        // Keeping code for when API key is available
        // const configResponse = await fetch('/api/sanctions/config');
        // const config = await configResponse.json();
        // setSanctionsConfig(config);

        // Fetch certifications
        const certResponse = await fetch(`/api/certifications?vendor_id=${vendor.id}`);
        const certData = await certResponse.json();
        if (certData.success) {
          setCertifications(certData.data || []);
        }
      } catch {
        // Silently handle
      }
    }
    fetchData();
  }, [vendor.id]);

  const refreshCertifications = async () => {
    try {
      const response = await fetch(`/api/certifications?vendor_id=${vendor.id}`);
      const data = await response.json();
      if (data.success) {
        setCertifications(data.data || []);
      }
    } catch {
      // Silently handle
    }
  };

  const handleCheckSanctions = async () => {
    setIsCheckingSanctions(true);
    setSanctionsError(null);

    try {
      const result = await checkSanctions(
        vendor.name,
        vendor.jurisdiction || undefined
      );

      if (isSanctionsError(result)) {
        setSanctionsError(result.message);
        toast.error('Sanctions Check Failed', {
          description: result.message,
        });
      } else {
        setSanctionsResult(result);
        if (result.matched) {
          toast.warning('Potential Matches Found', {
            description: `${result.matchCount} potential match${result.matchCount > 1 ? 'es' : ''} found on sanctions lists.`,
          });
        } else {
          toast.success('No Matches Found', {
            description: 'No sanctions matches found for this vendor.',
          });
        }
      }
    } catch {
      setSanctionsError('An unexpected error occurred');
      toast.error('Sanctions Check Failed', {
        description: 'An unexpected error occurred while checking sanctions.',
      });
    } finally {
      setIsCheckingSanctions(false);
    }
  };

  // Feature flag for sanctions - set to true when API key is available
  const SANCTIONS_ENABLED = false;

  return (
    <div className="space-y-6">
      {/* Sanctions Screening - Hidden until API subscription is available */}
      {SANCTIONS_ENABLED && (
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sanctions Screening
              </CardTitle>
              <Button
                size="sm"
                onClick={handleCheckSanctions}
                disabled={isCheckingSanctions}
                variant={sanctionsResult ? 'outline' : 'default'}
              >
                {isCheckingSanctions ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {sanctionsResult ? 'Refresh' : 'Run Check'}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sanctionsError && (
              <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
                <XCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Check Failed</p>
                  <p className="text-sm text-muted-foreground">{sanctionsError}</p>
                </div>
              </div>
            )}

            {!sanctionsResult && !sanctionsError && (
              <div className="p-8 text-center border border-dashed rounded-lg bg-muted/30">
                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-1">Sanctions Screening</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Check this vendor against global sanctions lists including OFAC SDN, EU Financial
                  Sanctions, UN Security Council, and UK HMT.
                </p>
                {sanctionsConfig && !sanctionsConfig.configured ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <Settings className="h-4 w-4" />
                      <span>API key required for sanctions screening</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={sanctionsConfig.signupUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Get Free API Key
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {sanctionsConfig.description}
                    </p>
                  </div>
                ) : (
                  <Button onClick={handleCheckSanctions} disabled={isCheckingSanctions}>
                    <Shield className="h-4 w-4 mr-2" />
                    Run Sanctions Check
                  </Button>
                )}
              </div>
            )}

            {sanctionsResult && (
              <div className="space-y-4">
                {/* Status Summary */}
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    sanctionsResult.matched
                      ? 'bg-error/10 border-error/20'
                      : 'bg-success/10 border-success/20'
                  }`}
                >
                  {sanctionsResult.matched ? (
                    <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {sanctionsResult.matched
                        ? `${sanctionsResult.matchCount} Potential Match${sanctionsResult.matchCount > 1 ? 'es' : ''} Found`
                        : 'No Matches Found'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {sanctionsResult.matched
                        ? 'Review matches below. High-confidence matches require immediate attention.'
                        : 'No matches found on OFAC SDN, EU, UN, or UK sanctions lists.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Checked: {new Date(sanctionsResult.checkedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Matches List */}
                {sanctionsResult.matched && sanctionsResult.matches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Potential Matches
                    </p>
                    {sanctionsResult.matches.map((match) => {
                      const formatted = formatSanctionsMatch(match);
                      return (
                        <div
                          key={match.id}
                          className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{formatted.title}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    formatted.severity === 'high'
                                      ? 'bg-error/10 text-error border-error/20'
                                      : formatted.severity === 'medium'
                                      ? 'bg-warning/10 text-warning border-warning/20'
                                      : 'bg-muted text-muted-foreground'
                                  }
                                >
                                  {Math.round(match.score * 100)}% match
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatted.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {formatted.sources.slice(0, 3).map((source) => (
                                  <Badge key={source} variant="secondary" className="text-xs">
                                    {source}
                                  </Badge>
                                ))}
                                {formatted.sources.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{formatted.sources.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Data Sources */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Data from OpenSanctions. Lists checked: OFAC SDN, EU Financial Sanctions, UN
                    Security Council, UK HMT, and {sanctionsResult.datasets.length - 4 > 0 ? `${sanctionsResult.datasets.length - 4} others` : 'more'}.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ISO Certifications - Now with direct database storage */}
      <VendorCertifications
        vendorId={vendor.id}
        vendorName={vendor.name}
        certifications={certifications}
        onRefresh={refreshCertifications}
      />

      {/* Coming Soon Features */}
      <Card className="card-elevated border-dashed">
        <CardContent className="py-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-medium mb-4">
            <Clock className="h-3 w-3" />
            Coming Soon
          </div>
          <h3 className="font-medium mb-2">More Enrichment Features</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Future updates will include sanctions screening (OFAC, EU, UN), data breach monitoring,
            news alerts, and automated certification tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
