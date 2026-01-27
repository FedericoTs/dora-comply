/**
 * Kanban Board Page - Redirect
 *
 * This page now redirects to the main remediation page.
 * The unified /remediation page handles Plans, Kanban, and My Actions with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Kanban Board | Remediation',
  description: 'Visual Kanban board for managing remediation actions',
};

export default function KanbanPage() {
  redirect('/remediation');
}
