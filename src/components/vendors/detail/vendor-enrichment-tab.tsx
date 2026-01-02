'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  Award,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  checkSanctions,
  isSanctionsError,
  formatSanctionsMatch,
  type SanctionsResult,
} from '@/lib/external/opensanctions';
import {
  generateIAFSearchUrl,
  ISO_STANDARDS,
  type ISOStandard,
} from '@/lib/external/iaf-certsearch';
import type { Vendor } from '@/lib/vendors/types';

interface VendorEnrichmentTabProps {
  vendor: Vendor;
}

export function VendorEnrichmentTab({ vendor }: VendorEnrichmentTabProps) {
  const [sanctionsResult, setSanctionsResult] = useState<SanctionsResult | null>(null);
  const [isCheckingSanctions, setIsCheckingSanctions] = useState(false);
  const [sanctionsError, setSanctionsError] = useState<string | null>(null);

  const iafSearchUrl = generateIAFSearchUrl(
    vendor.name,
    vendor.jurisdiction || undefined
  );

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

  return (
    <div className="space-y-6">
      {/* Sanctions Screening */}
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
              <Button onClick={handleCheckSanctions} disabled={isCheckingSanctions}>
                <Shield className="h-4 w-4 mr-2" />
                Run Sanctions Check
              </Button>
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

      {/* ISO Certifications */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              ISO Certifications
            </CardTitle>
            <Button size="sm" variant="outline" asChild>
              <a href={iafSearchUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Search IAF CertSearch
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verify ISO certifications on the official IAF CertSearch database. The following
              certifications are relevant for ICT provider due diligence under DORA:
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.entries(ISO_STANDARDS) as [ISOStandard, typeof ISO_STANDARDS[ISOStandard]][])
                .filter(([, value]) => value.relevance === 'critical' || value.relevance === 'high')
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded ${
                          value.relevance === 'critical'
                            ? 'bg-primary/10'
                            : 'bg-info/10'
                        }`}
                      >
                        <Award
                          className={`h-4 w-4 ${
                            value.relevance === 'critical'
                              ? 'text-primary'
                              : 'text-info'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{key}</span>
                          {value.relevance === 'critical' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-primary/10 text-primary border-primary/20"
                                  >
                                    Critical
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Highly recommended for DORA compliance</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {value.name}
                        </p>
                      </div>
                      <HelpCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Verify Certifications</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Click &ldquo;Search IAF CertSearch&rdquo; to verify this vendor&apos;s ISO certifications
                    on the official International Accreditation Forum database.
                  </p>
                  <Button size="sm" variant="link" className="h-auto p-0 mt-2" asChild>
                    <a href={iafSearchUrl} target="_blank" rel="noopener noreferrer">
                      Open IAF CertSearch
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card className="card-elevated border-dashed">
        <CardContent className="py-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-medium mb-4">
            <Clock className="h-3 w-3" />
            Coming Soon
          </div>
          <h3 className="font-medium mb-2">More Enrichment Features</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Future updates will include data breach monitoring (HaveIBeenPwned), news alerts, and
            automated certification tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
