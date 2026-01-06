'use client';

/**
 * Contractual Arrangements Step (Step 3)
 *
 * Link providers to contracts and services for RoI B_03.01
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  ExternalLink,
  LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WizardStep, StepSection, EmptyStepState } from './wizard-step';
import type { OnboardingStepData, WizardStepId } from '@/lib/roi/onboarding-types';

interface ServicesStepProps {
  validation?: OnboardingStepData;
  onBack?: () => void;
  onNext?: () => void;
}

interface ContractSummary {
  id: string;
  vendorName: string;
  contractType: string;
  startDate: string | null;
  endDate: string | null;
  value: number | null;
  currency: string;
  status: string;
  servicesCount: number;
}

export function ServicesStep({ validation, onBack, onNext }: ServicesStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);

  // Load existing contracts
  useEffect(() => {
    async function loadContracts() {
      try {
        const response = await fetch('/api/contracts?limit=50');
        if (response.ok) {
          const data = await response.json();
          setContracts(
            data.contracts?.map((c: Record<string, unknown>) => ({
              id: c.id,
              vendorName: (c.vendor as { name?: string })?.name || 'Unknown Vendor',
              contractType: c.contract_type || 'Service Agreement',
              startDate: c.start_date,
              endDate: c.end_date,
              value: c.annual_value,
              currency: c.currency || 'EUR',
              status: c.status || 'active',
              servicesCount: (c.services as unknown[])?.length || 0,
            })) || []
          );
        }
      } catch (error) {
        console.error('Failed to load contracts:', error);
      } finally {
        setIsLoadingContracts(false);
      }
    }
    loadContracts();
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/roi/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: 3, markComplete: contracts.length > 0 }),
      });
      onNext?.();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number | null, currency: string) => {
    if (value === null) return 'Not specified';
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'expiring':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <WizardStep
      stepId={3 as WizardStepId}
      title="Contractual Arrangements"
      description="Link your ICT providers to their contracts. This populates the B_03.01 template."
      icon={<FileText className="h-6 w-6" />}
      validation={validation}
      isLoading={isLoading}
      onBack={onBack}
      onNext={handleNext}
      nextLabel={contracts.length === 0 ? 'Skip for Now' : 'Continue'}
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/contracts/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Contract
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/vendors">
              <LinkIcon className="mr-2 h-4 w-4" />
              Link Existing Vendors
            </Link>
          </Button>
        </div>

        {/* Contracts List or Empty State */}
        {isLoadingContracts ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <EmptyStepState
            icon={<FileText className="h-8 w-8 text-muted-foreground" />}
            title="No Contracts Yet"
            description="Add contracts for your ICT providers to complete the contractual arrangements section of the Register."
            action={
              <Button size="sm" asChild>
                <Link href="/contracts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contract
                </Link>
              </Button>
            }
          />
        ) : (
          <StepSection
            title={`${contracts.length} Contract${contracts.length !== 1 ? 's' : ''} Added`}
            description="Review your contractual arrangements below"
          >
            <div className="space-y-2">
              {contracts.map((contract) => (
                <Card key={contract.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium truncate">{contract.vendorName}</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.contractType}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                            </span>
                            <span>
                              {formatCurrency(contract.value, contract.currency)}/yr
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {contract.servicesCount > 0 ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {contract.servicesCount} service{contract.servicesCount !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            No services
                          </Badge>
                        )}
                        <Badge variant={getStatusBadgeVariant(contract.status)}>
                          {contract.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link href={`/contracts/${contract.id}`}>
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
                <Link href="/contracts">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View All Contracts
                </Link>
              </Button>
            </div>
          </StepSection>
        )}

        {/* Tips */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="font-medium text-sm mb-2">Contract Requirements for RoI</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <span className="text-foreground font-medium">Contract dates</span> determine the reporting period
            </li>
            <li>
              <span className="text-foreground font-medium">Annual value</span> helps assess concentration risk
            </li>
            <li>
              Link <span className="text-foreground font-medium">ICT services</span> to each contract for B_04.01
            </li>
          </ul>
        </div>
      </div>
    </WizardStep>
  );
}
