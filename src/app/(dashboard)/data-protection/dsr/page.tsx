/**
 * Data Subject Requests Page - Redirect
 *
 * This page now redirects to the main data protection page.
 * The unified /data-protection page handles all GDPR sections with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Data Subject Requests | GDPR Compliance',
  description: 'Manage data subject rights requests - Articles 15-22 GDPR compliance',
};

export default function DSRPage() {
  redirect('/data-protection');
}
