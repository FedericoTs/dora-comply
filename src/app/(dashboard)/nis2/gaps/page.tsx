/**
 * NIS2 Gap Analysis Page - Redirect
 *
 * This page now redirects to the main NIS2 compliance page.
 * The unified /nis2 page handles Overview and Gap Analysis with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'NIS2 Gap Analysis | DORA Comply',
  description: 'View and manage NIS2 compliance gaps',
};

export default function NIS2GapsPage() {
  redirect('/nis2');
}
