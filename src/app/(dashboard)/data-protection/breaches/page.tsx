/**
 * Data Breaches Page - Redirect
 *
 * This page now redirects to the main data protection page.
 * The unified /data-protection page handles all GDPR sections with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Data Breaches | GDPR Compliance',
  description: 'Personal data breach log - Articles 33-34 GDPR compliance',
};

export default function BreachesPage() {
  redirect('/data-protection');
}
