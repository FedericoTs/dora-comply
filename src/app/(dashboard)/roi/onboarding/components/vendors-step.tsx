'use client';

/**
 * ICT Providers Step (Step 2)
 *
 * Add and manage third-party ICT service providers for RoI B_02.01
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Plus,
  ExternalLink,
  FileUp,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WizardStep, StepSection, EmptyStepState } from './wizard-step';
import type { OnboardingStepData, WizardStepId } from '@/lib/roi/onboarding-types';

interface VendorsStepProps {
  validation?: OnboardingStepData;
  onBack?: () => void;
  onNext?: () => void;
}

interface VendorSummary {
  id: string;
  name: string;
  category: string;
  riskLevel: string;
  hasContract: boolean;
  hasLei: boolean;
}

export function VendorsStep({ validation, onBack, onNext }: VendorsStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);

  // Load existing vendors
  useEffect(() => {
    async function loadVendors() {
      try {
        const response = await fetch('/api/vendors?limit=50');
        if (response.ok) {
          const data = await response.json();
          setVendors(
            data.vendors?.map((v: Record<string, unknown>) => ({
              id: v.id,
              name: v.name,
              category: v.category || 'Uncategorized',
              riskLevel: v.risk_level || 'medium',
              hasContract: !!v.contract_id,
              hasLei: !!v.lei_code,
            })) || []
          );
        }
      } catch (error) {
        console.error('Failed to load vendors:', error);
      } finally {
        setIsLoadingVendors(false);
      }
    }
    loadVendors();
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    // Mark step as complete in progress tracker
    try {
      await fetch('/api/roi/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: 2, markComplete: vendors.length > 0 }),
      });
      onNext?.();
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <WizardStep
      stepId={2 as WizardStepId}
      title="ICT Service Providers"
      description="Add your third-party ICT providers. These will populate the B_02.01 template."
      icon={<Building className="h-6 w-6" />}
      validation={validation}
      isLoading={isLoading}
      onBack={onBack}
      onNext={handleNext}
      nextLabel={vendors.length === 0 ? 'Skip for Now' : 'Continue'}
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/documents?upload=true&type=soc2">
              <FileUp className="mr-2 h-4 w-4" />
              Import from SOC2
            </Link>
          </Button>
        </div>

        {/* Vendors List or Empty State */}
        {isLoadingVendors ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <EmptyStepState
            icon={<Building className="h-8 w-8 text-muted-foreground" />}
            title="No ICT Providers Yet"
            description="Add your third-party vendors to build your Register of Information. You can also import them automatically from SOC2 reports."
            action={
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link href="/vendors/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Manually
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/documents?upload=true&type=soc2">
                    <FileUp className="mr-2 h-4 w-4" />
                    Import from SOC2
                  </Link>
                </Button>
              </div>
            }
          />
        ) : (
          <StepSection
            title={`${vendors.length} Provider${vendors.length !== 1 ? 's' : ''} Added`}
            description="Review your ICT service providers below"
          >
            <div className="space-y-2">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Building className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{vendor.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {vendor.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {vendor.hasLei ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            LEI
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            No LEI
                          </Badge>
                        )}
                        <Badge variant={getRiskBadgeVariant(vendor.riskLevel)}>
                          {vendor.riskLevel}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link href={`/vendors/${vendor.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/vendors">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View All Vendors
                </Link>
              </Button>
            </div>
          </StepSection>
        )}

        {/* Tips */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="font-medium text-sm mb-2">Tips for RoI Compliance</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <span className="text-foreground font-medium">LEI codes</span> are required for all ICT providers in the RoI
            </li>
            <li>
              <span className="text-foreground font-medium">Upload SOC2 reports</span> to auto-populate vendor details
            </li>
            <li>
              Include providers for <span className="text-foreground font-medium">cloud, software, and data services</span>
            </li>
          </ul>
        </div>
      </div>
    </WizardStep>
  );
}
