/**
 * My Actions Page
 *
 * Shows remediation actions assigned to the current user.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getMyActions } from '@/lib/remediation/queries';
import { getCurrentUserId } from '@/lib/auth/organization';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionCard } from '@/components/remediation/action-card';

export const metadata = {
  title: 'My Actions | Remediation',
  description: 'View your assigned remediation actions',
};

async function MyActionsContent() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please log in to view your actions.</p>
        </CardContent>
      </Card>
    );
  }

  const actions = await getMyActions(userId);

  if (actions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No actions assigned</h3>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any remediation actions assigned to you yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map(action => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  );
}

export default function MyActionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/remediation">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Actions</h1>
          <p className="text-muted-foreground text-sm">
            Remediation actions assigned to you
          </p>
        </div>
      </div>

      <Suspense fallback={<MyActionsLoading />}>
        <MyActionsContent />
      </Suspense>
    </div>
  );
}

function MyActionsLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}
