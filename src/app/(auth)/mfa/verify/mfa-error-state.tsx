import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/auth/auth-card';

interface MFAErrorStateProps {
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
}

export function MFAErrorState({
  title,
  message,
  actionLabel,
  actionHref,
}: MFAErrorStateProps) {
  return (
    <AuthCard
      title={title}
      description="There was a problem with two-factor authentication"
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">{message}</p>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}
