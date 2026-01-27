/**
 * Questionnaire Templates Page - Redirect
 *
 * This page now redirects to the main questionnaires page.
 * The unified /questionnaires page handles Questionnaires and Templates with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Questionnaire Templates | NIS2 Comply',
  description: 'Manage NIS2 vendor questionnaire templates',
};

export default function TemplatesPage() {
  redirect('/questionnaires');
}
