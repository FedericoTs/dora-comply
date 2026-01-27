/**
 * Incident Edit Page - Redirect
 *
 * This page now redirects to the main incident detail page.
 * Edit functionality is integrated as a tab on the detail page.
 */

import { redirect } from 'next/navigation';

interface IncidentEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IncidentEditPageProps) {
  const { id } = await params;
  return {
    title: `Edit Incident | DORA Comply`,
    description: `Edit incident details`,
  };
}

export default async function IncidentEditPage({ params }: IncidentEditPageProps) {
  const { id } = await params;
  redirect(`/incidents/${id}`);
}
