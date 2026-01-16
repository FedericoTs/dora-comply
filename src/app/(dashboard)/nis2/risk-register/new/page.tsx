/**
 * New NIS2 Risk Page
 *
 * Form for creating a new NIS2 risk entry
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskForm } from './risk-form';

export const metadata: Metadata = {
  title: 'Add Risk | NIS2 Risk Register | DORA Comply',
  description: 'Add a new risk to the NIS2 risk register',
};

export default function NewRiskPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/nis2/risk-register">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Risk Register
        </Link>
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Risk</h1>
        <p className="text-muted-foreground">
          Register a new risk in your NIS2 risk register. Assess its likelihood and impact
          to calculate the inherent risk score.
        </p>
      </div>

      {/* Form */}
      <RiskForm />
    </div>
  );
}
