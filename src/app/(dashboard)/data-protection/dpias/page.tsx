/**
 * Impact Assessments (DPIA) Page - Redirect
 *
 * This page now redirects to the main data protection page.
 * The unified /data-protection page handles all GDPR sections with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Impact Assessments | GDPR Compliance',
  description: 'Data Protection Impact Assessments (DPIA) - Article 35 GDPR compliance',
};

export default function DPIAsPage() {
  redirect('/data-protection');
}
