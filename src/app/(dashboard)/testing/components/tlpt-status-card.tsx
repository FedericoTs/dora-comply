/**
 * TLPT Status Card Components
 *
 * Displays TLPT engagement status for significant entities
 * or information card for non-significant entities
 */

import Link from 'next/link';
import { Plus, Target, Info, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getTLPTEngagements } from '@/lib/testing/queries';
import { getTLPTFrameworkLabel } from '@/lib/testing/types';

export async function TLPTStatusCard() {
  const { data: engagements } = await getTLPTEngagements();

  if (!engagements || engagements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            TLPT Engagements
          </CardTitle>
          <CardDescription>Threat-Led Penetration Testing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No TLPT engagements yet. Significant entities must conduct TLPT every 3 years.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/testing/tlpt/new">
              <Plus className="mr-2 h-4 w-4" />
              Plan TLPT
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              TLPT Engagements
            </CardTitle>
            <CardDescription>Article 26 - Advanced testing</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/testing/tlpt">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {engagements.slice(0, 3).map((tlpt) => (
          <Link
            key={tlpt.id}
            href={`/testing/tlpt/${tlpt.id}`}
            className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{tlpt.name}</p>
              <p className="text-xs text-muted-foreground">
                {tlpt.tlpt_ref} · {getTLPTFrameworkLabel(tlpt.framework)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge
                variant={
                  tlpt.compliance_status === 'overdue'
                    ? 'destructive'
                    : tlpt.compliance_status === 'due_soon'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {tlpt.compliance_status === 'overdue'
                  ? 'Overdue'
                  : tlpt.compliance_status === 'due_soon'
                  ? `Due in ${tlpt.days_until_due}d`
                  : tlpt.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function NonSignificantTLPTInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          TLPT Not Required
        </CardTitle>
        <CardDescription>Based on your entity classification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-info/50 bg-info/5">
          <Scale className="h-4 w-4 text-info" />
          <AlertTitle className="text-info">Non-Significant Entity</AlertTitle>
          <AlertDescription className="text-sm">
            Threat-Led Penetration Testing (TLPT) under DORA Article 26-27 is mandatory only
            for significant financial entities. Your organization is classified as non-significant.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          While TLPT is not required, you may still conduct voluntary advanced penetration testing
          as part of your resilience testing programme.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/organization">
              Review Classification
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/testing/tlpt/new">
              Plan Voluntary TLPT
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
