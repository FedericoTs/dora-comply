/**
 * Processing Activities Page - Redirect
 *
 * This page now redirects to the main data protection page.
 * The unified /data-protection page handles all GDPR sections with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Processing Activities | GDPR Compliance',
  description: 'Record of Processing Activities (RoPA) - Article 30 GDPR compliance',
};

export default function ProcessingActivitiesPage() {
  redirect('/data-protection');
}
