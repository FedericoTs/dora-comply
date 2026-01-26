/**
 * Tests List Page - Redirect
 *
 * This page now redirects to the main testing page.
 * The unified /testing page handles both Tests and TLPT with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Tests | Resilience Testing | DORA Comply',
  description: 'Manage resilience tests per DORA Article 25',
};

export default function TestsPage() {
  redirect('/testing');
}
