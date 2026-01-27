/**
 * My Actions Page - Redirect
 *
 * This page now redirects to the main remediation page.
 * The unified /remediation page handles Plans, Kanban, and My Actions with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'My Actions | Remediation',
  description: 'View your assigned remediation actions',
};

export default function MyActionsPage() {
  redirect('/remediation');
}
