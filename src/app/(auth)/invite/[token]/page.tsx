/**
 * Invitation Acceptance Page
 *
 * Handles team member invitation acceptance flow
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { InviteAcceptContent } from './invite-accept-content';

export const metadata: Metadata = {
  title: 'Accept Invitation | NIS2 Comply',
  description: 'Accept your team invitation to join the compliance platform',
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <InviteAcceptContent token={token} />
    </Suspense>
  );
}
