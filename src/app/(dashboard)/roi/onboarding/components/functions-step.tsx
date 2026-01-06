'use client';

/**
 * Critical Functions Step (Step 4)
 *
 * Map ICT services to business critical functions for RoI B_04.01 and B_05.01
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ExternalLink,
  AlertTriangle,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WizardStep, StepSection, EmptyStepState } from './wizard-step';
import type { OnboardingStepData, WizardStepId } from '@/lib/roi/onboarding-types';

interface FunctionsStepProps {
  validation?: OnboardingStepData;
  onBack?: () => void;
  onNext?: () => void;
}

interface FunctionSummary {
  id: string;
  name: string;
  type: 'critical' | 'important' | 'other';
  description: string | null;
  linkedServices: number;
  linkedVendors: number;
}

export function FunctionsStep({ validation, onBack, onNext }: FunctionsStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [functions, setFunctions] = useState<FunctionSummary[]>([]);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(true);

  // Load existing critical functions
  useEffect(() => {
    async function loadFunctions() {
      try {
        const response = await fetch('/api/critical-functions?limit=50');
        if (response.ok) {
          const data = await response.json();
          setFunctions(
            data.functions?.map((f: Record<string, unknown>) => ({
              id: f.id,
              name: f.name,
              type: f.function_type || 'important',
              description: f.description,
              linkedServices: (f.services as unknown[])?.length || 0,
              linkedVendors: (f.vendors as unknown[])?.length || 0,
            })) || []
          );
        }
      } catch (error) {
        console.error('Failed to load functions:', error);
      } finally {
        setIsLoadingFunctions(false);
      }
    }
    loadFunctions();
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/roi/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: 4, markComplete: functions.length > 0 }),
      });
      onNext?.();
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            <Shield className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        );
      case 'important':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Zap className="mr-1 h-3 w-3" />
            Important
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Other
          </Badge>
        );
    }
  };

  const criticalCount = functions.filter(f => f.type === 'critical').length;
  const importantCount = functions.filter(f => f.type === 'important').length;

  return (
    <WizardStep
      stepId={4 as WizardStepId}
      title="Critical & Important Functions"
      description="Identify functions supported by ICT services for RoI templates B_04.01 and B_05.01"
      icon={<Layers className="h-6 w-6" />}
      validation={validation}
      isLoading={isLoading}
      onBack={onBack}
      onNext={handleNext}
      nextLabel={functions.length === 0 ? 'Skip for Now' : 'Continue'}
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/critical-functions/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Function
            </Link>
          </Button>
        </div>

        {/* Summary Stats */}
        {functions.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{criticalCount}</p>
                    <p className="text-sm text-muted-foreground">Critical Functions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Zap className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{importantCount}</p>
                    <p className="text-sm text-muted-foreground">Important Functions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Functions List or Empty State */}
        {isLoadingFunctions ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : functions.length === 0 ? (
          <EmptyStepState
            icon={<Layers className="h-8 w-8 text-muted-foreground" />}
            title="No Functions Mapped"
            description="Identify your critical and important business functions that rely on ICT services. This is required for DORA Article 30 compliance."
            action={
              <Button size="sm" asChild>
                <Link href="/critical-functions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Function
                </Link>
              </Button>
            }
          />
        ) : (
          <StepSection
            title={`${functions.length} Function${functions.length !== 1 ? 's' : ''} Mapped`}
            description="Your critical and important business functions"
          >
            <div className="space-y-2">
              {functions.map((func) => (
                <Card key={func.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Layers className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{func.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {func.description || 'No description'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {func.linkedServices === 0 && func.linkedVendors === 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Not linked
                          </Badge>
                        )}
                        {func.linkedServices > 0 && (
                          <Badge variant="outline">
                            {func.linkedServices} service{func.linkedServices !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {getTypeBadge(func.type)}
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link href={`/critical-functions/${func.id}`}>
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
                <Link href="/critical-functions">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View All Functions
                </Link>
              </Button>
            </div>
          </StepSection>
        )}

        {/* Tips */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="font-medium text-sm mb-2">DORA Function Requirements</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <span className="text-foreground font-medium">Critical functions</span> are those whose disruption would materially impair financial performance or service continuity
            </li>
            <li>
              <span className="text-foreground font-medium">Important functions</span> support critical operations but are not directly critical
            </li>
            <li>
              Link each function to the <span className="text-foreground font-medium">ICT services and vendors</span> that support it
            </li>
          </ul>
        </div>
      </div>
    </WizardStep>
  );
}
