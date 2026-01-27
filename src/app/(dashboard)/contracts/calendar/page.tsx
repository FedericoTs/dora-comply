/**
 * Contract Calendar Page - Redirect
 *
 * This page now redirects to the main contracts page.
 * The unified /contracts page handles List and Calendar with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Contract Calendar | Contracts',
  description: 'View contract deadlines, renewals, and alerts on a calendar',
};

export default function ContractCalendarPage() {
  redirect('/contracts');
}
